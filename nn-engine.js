/* Local character-level LSTM inference for the Mwesh writing tool. */
const COMMON_ENGLISH_WORDS = new Set([
  "the","and","of","a","to","in","is","was","it","that","he","she","we","they",
  "you","i","this","but","not","with","for","on","at","by","as","are","be","been",
  "from","has","have","had","will","would","could","should","do","does","did","so",
  "if","or","no","yes","all","some","any","more","most","than","then","when","where",
  "what","who","which","how","why","there","here","now","still","just","only","even",
  "also","its","it's","my","your","his","her","our","their","me","him","us","them",
  "one","two","first","last","own","same","other","such","an","can","into","out","up",
  "down","over","under","again","once","too","very","about","after","before","between"
]);

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
    this.poemLines = [];
    this.usedLines = new Set();
    this.knownWords = new Set();
  }

  setPoemLines(lines) {
    this.poemLines = lines.filter(l => l.trim().length >= 8);
    // Build a reference vocabulary from your real poems, so generated
    // lines can be scored on how much of their language is real English
    // the model actually learned well, vs invented/garbled fragments —
    // this is what lets best-of-N selection reliably prefer the more
    // coherent draft instead of just the right-length one.
    this.knownWords = new Set();
    for(const line of this.poemLines){
      const words = line.toLowerCase().match(/[a-z']+/g) || [];
      for(const w of words) this.knownWords.add(w);
    }
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
    // No clamping here on purpose: an extremely long, rambling draft should
    // score clearly worse than a reasonable one, not just neutral — a flat
    // floor of 0 let a few very long run-on outputs slip through as
    // 'no better, no worse' when nothing else beat them.
    score += (25 - Math.abs(58 - text.length));
    score += (12 - Math.abs(9 - text.split(/\s+/).length));

    // Penalize lines heavy with words the model never really learned —
    // the clearest signal for the char-LSTM's occasional word-salad output.
    const words = text.toLowerCase().match(/[a-z']+/g) || [];
    if(words.length){
      const known = words.filter(w => this.knownWords.has(w) || COMMON_ENGLISH_WORDS.has(w)).length;
      const unknownRatio = 1 - (known / words.length);
      score -= unknownRatio * 70;
    }
    return score;
  }

  generate(history, options = {}) {
    const context = (history || []).join('\n').slice(-500);
    const attempts = options.attempts || 5;
    let best = null;

    // Exclude lines already used earlier in this session — without this,
    // once a poem line gets picked, its own words stay in the accumulated
    // context forever (the bot's past replies are part of history too),
    // so it keeps scoring highest against itself and repeats endlessly.
    const poemCandidates = this.findPoemCandidates(context, 6)
      .filter(line => !this.usedLines.has(line));
    for(const line of poemCandidates) {
      const score = this.scoreLine(line) + 10;
      if(!best || score > best.score) best = { line, score };
    }

    for(let attempt = 0; attempt < attempts; attempt++){
      const temperature = 0.6 + (attempt % 3) * 0.13;
      const line = this.draftLine(context, temperature);
      if(this.usedLines.has(line)) continue;
      const score = this.scoreLine(line);
      if(score === -1000) continue;
      if(!best || score > best.score) best = { line, score };
    }

    let result = best ? best.line : this.draftLine(context, 0.7);
    // last-resort safety: if everything collided with a used line, force
    // one more fresh draft rather than returning a repeat
    if(this.usedLines.has(result)){
      result = this.draftLine(context, 0.9);
    }
    this.usedLines.add(result);
    return result;
  }

  findPoemCandidates(context, k) {
    if(!this.poemLines.length) return [];
    const ctxWords = this.extractWords(context.toLowerCase().slice(-200));
    if(!ctxWords.size) return this.poemLines.slice(0, k);
    const scored = this.poemLines.map(line => {
      const lineWords = this.extractWords(line.toLowerCase());
      let overlap = 0;
      for(const w of lineWords) if(ctxWords.has(w)) overlap++;
      const recency = this.poemLines.indexOf(line);
      return { line, score: overlap * 2 - recency * 0.001 };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k).map(c => c.line);
  }

  extractWords(text) {
    const set = new Set();
    const words = text.match(/[a-z']{3,}/gi) || [];
    for(const w of words) set.add(w.toLowerCase());
    return set;
  }
}

let mweshNeuralEngine = null;
const mweshNeuralEngineReady = MweshNeuralEngine.load()
  .then(engine => { mweshNeuralEngine = engine; return engine; })
  .catch(() => null);
