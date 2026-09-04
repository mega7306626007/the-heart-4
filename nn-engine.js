/* Local character-level LSTM inference for the Mwesh writing tool. */
class MweshNeuralEngine {
  constructor(manifest, weights) {
    this.manifest = manifest;
    this.weights = weights;
    this.vocabSize = manifest.vocab_size;
    this.embedDim = manifest.embed_dim;
    this.hiddenDim = manifest.hidden_dim;
    this.stoi = manifest.stoi;
    this.itos = manifest.itos;
    this.tensors = Object.fromEntries(
      Object.entries(manifest.tensors).map(([name, tensor]) => [
        name,
        new Float32Array(weights, tensor.offset, tensor.length)
      ])
    );
  }

  static async load() {
    const [manifestResponse, weightsResponse] = await Promise.all([
      fetch('nn-manifest.json'),
      fetch('mwesh_weights.bin')
    ]);
    if(!manifestResponse.ok || !weightsResponse.ok) {
      throw new Error('Neural model files unavailable');
    }
    const manifest = await manifestResponse.json();
    const weights = await (await weightsResponse.blob()).arrayBuffer();
    return new MweshNeuralEngine(manifest, weights);
  }

  vectorFor(char) {
    const index = this.stoi[char] ?? this.stoi[' '];
    const embedding = this.tensors['embed.weight'];
    return embedding.subarray(index * this.embedDim, (index + 1) * this.embedDim);
  }

  step(input, hidden, cell, layer) {
    const inputSize = layer === 0 ? this.embedDim : this.hiddenDim;
    const weightInput = this.tensors[`lstm.weight_ih_l${layer}`];
    const weightHidden = this.tensors[`lstm.weight_hh_l${layer}`];
    const biasInput = this.tensors[`lstm.bias_ih_l${layer}`];
    const biasHidden = this.tensors[`lstm.bias_hh_l${layer}`];
    const nextHidden = new Float32Array(this.hiddenDim);
    const nextCell = new Float32Array(this.hiddenDim);

    for(let unit = 0; unit < this.hiddenDim; unit++) {
      const gates = [0, 0, 0, 0];
      for(let gate = 0; gate < 4; gate++) {
        const row = (gate * this.hiddenDim + unit) * inputSize;
        const hiddenRow = (gate * this.hiddenDim + unit) * this.hiddenDim;
        let value = biasInput[gate * this.hiddenDim + unit] + biasHidden[gate * this.hiddenDim + unit];
        for(let column = 0; column < inputSize; column++) value += weightInput[row + column] * input[column];
        for(let column = 0; column < this.hiddenDim; column++) value += weightHidden[hiddenRow + column] * hidden[column];
        gates[gate] = value;
      }
      const inputGate = 1 / (1 + Math.exp(-gates[0]));
      const forgetGate = 1 / (1 + Math.exp(-gates[1]));
      const cellCandidate = Math.tanh(gates[2]);
      const outputGate = 1 / (1 + Math.exp(-gates[3]));
      nextCell[unit] = forgetGate * cell[unit] + inputGate * cellCandidate;
      nextHidden[unit] = outputGate * Math.tanh(nextCell[unit]);
    }
    return [nextHidden, nextCell];
  }

  advance(char, state) {
    let input = this.vectorFor(char);
    for(let layer = 0; layer < 2; layer++) {
      const result = this.step(input, state.hidden[layer], state.cell[layer], layer);
      state.hidden[layer] = result[0];
      state.cell[layer] = result[1];
      input = result[0];
    }
  }

  logits(hidden) {
    const weight = this.tensors['fc.weight'];
    const bias = this.tensors['fc.bias'];
    const scores = new Float32Array(this.vocabSize);
    for(let row = 0; row < this.vocabSize; row++) {
      let score = bias[row];
      for(let column = 0; column < this.hiddenDim; column++) score += weight[row * this.hiddenDim + column] * hidden[column];
      scores[row] = score;
    }
    return scores;
  }

  freshState() {
    return {
      hidden: [new Float32Array(this.hiddenDim), new Float32Array(this.hiddenDim)],
      cell: [new Float32Array(this.hiddenDim), new Float32Array(this.hiddenDim)]
    };
  }

  sampleTopP(scores, temperature, topP) {
    const scaled = Array.from(scores, score => score / temperature);
    const maxScore = Math.max(...scaled);
    const weights = scaled.map(score => Math.exp(score - maxScore));
    const total = weights.reduce((sum, value) => sum + value, 0);
    const order = weights
      .map((weight, index) => [weight / total, index])
      .sort((a, b) => b[0] - a[0]);
    const kept = [];
    let mass = 0;
    for(const [probability, index] of order){
      kept.push(index);
      mass += probability;
      if(mass >= topP) break;
    }
    const keptMass = kept.reduce((sum, index) => sum + weights[index] / total, 0);
    let target = Math.random() * keptMass;
    for(const index of kept){
      target -= weights[index] / total;
      if(target <= 0) return index;
    }
    return kept[kept.length - 1];
  }

  endsPunctuation(text) {
    const last = text.replace(/\s+$/, '').slice(-1);
    return '.!?;—…'.includes(last);
  }

  draftLine(context, temperature) {
    const state = this.freshState();
    for(const char of context) this.advance(char, state);
    let output = '';
    for(let step = 0; step < 260; step++){
      const index = this.sampleTopP(this.logits(state.hidden[1]), temperature, 0.9);
      const char = this.itos[String(index)] ?? ' ';
      if(char === '\n'){
        if(output.trim().length >= 14 && this.endsPunctuation(output)) break;
        continue;
      }
      const recent = output.slice(-4);
      if(recent.length >= 4 && recent.split('').every(previous => previous === char)) continue;
      output += char;
      this.advance(char, state);
      if(output.length >= 170 && this.endsPunctuation(output)) break;
    }
    return output.replace(/[\s,;:]+$/, '').trim();
  }

  scoreLine(line) {
    const text = line.trim();
    if(text.length < 14) return -1000;
    if(!/\s/.test(text)) return -1000;
    if(/(.)\1{5,}/.test(text)) return -500;
    let score = 0;
    if(this.endsPunctuation(text)) score += 30;
    score += Math.max(0, 25 - Math.abs(58 - text.length));
    score += Math.max(0, 12 - Math.abs(9 - text.split(/\s+/).length));
    return score;
  }

  generate(history, options = {}) {
    const context = (history || []).join('\n').slice(-500);
    const attempts = options.attempts || 5;
    let best = null;
    for(let attempt = 0; attempt < attempts; attempt++){
      const temperature = 0.6 + (attempt % 3) * 0.13;
      const line = this.draftLine(context, temperature);
      const score = this.scoreLine(line);
      if(score === -1000) continue;
      if(!best || score > best.score) best = { line, score };
    }
    return best ? best.line : this.draftLine(context, 0.7);
  }
}

let mweshNeuralEngine = null;
const mweshNeuralEngineReady = MweshNeuralEngine.load()
  .then(engine => { mweshNeuralEngine = engine; return engine; })
  .catch(() => null);
