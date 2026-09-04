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

  sample(scores, temperature = 0.75) {
    const scaled = Array.from(scores, score => score / temperature);
    const maxScore = Math.max(...scaled);
    const probabilities = scaled.map(score => Math.exp(score - maxScore));
    const total = probabilities.reduce((sum, value) => sum + value, 0);
    let target = Math.random() * total;
    for(let index = 0; index < probabilities.length; index++) {
      target -= probabilities[index];
      if(target <= 0) return index;
    }
    return probabilities.length - 1;
  }

  generate(history, maxCharacters = 180) {
    const state = {
      hidden: [new Float32Array(this.hiddenDim), new Float32Array(this.hiddenDim)],
      cell: [new Float32Array(this.hiddenDim), new Float32Array(this.hiddenDim)]
    };
    const context = history.join('\n').slice(-500);
    for(const char of context) this.advance(char, state);

    let output = '';
    let generatedNewline = false;
    for(let step = 0; step < maxCharacters; step++) {
      const index = this.sample(this.logits(state.hidden[1]));
      const char = this.itos[String(index)] ?? ' ';
      if(char === '\n') {
        if(output.trim().length >= 12) {
          generatedNewline = true;
          break;
        }
        continue;
      }
      const recent = output.slice(-6);
      if(recent.length >= 4 && recent.split('').every(previous => previous === char)) continue;
      output += char;
      this.advance(char, state);
      if(generatedNewline) break;
    }
    return output.trim();
  }
}

let mweshNeuralEngine = null;
const mweshNeuralEngineReady = MweshNeuralEngine.load()
  .then(engine => { mweshNeuralEngine = engine; return engine; })
  .catch(() => null);
