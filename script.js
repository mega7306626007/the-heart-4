/* ============================================================
   MWESH SITE — script.js
   Pure client-side JS. No build step, no framework, no API.
   The writing tool runs entirely in the browser through
   nn-engine.js and the trained model in this folder. Nothing
   ever leaves this page and nothing is fetched from any server.
   ============================================================ */

document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- POEMS ----------
   The full collection lives in POEMS below, pulled from
   mwesh-original-poems.md. Every poem gets its own copyright
   line automatically. */
const POEMS = [
  {
    title: "What the Well Told No One",
    lines: [
      "The well does not gossip.",
      "It takes what the bucket brings down —",
      "a face, a prayer, a curse muttered at 5 a.m. —",
      "and gives back only water, level and cold.",
      "My grandmother trusted it more than the church.",
      "\"The well,\" she said, \"has never once",
      "told me I was asking for too much.\"",
    ]
  },
  {
    title: "Flood Season",
    lines: [
      "The river outgrew its banks on a Tuesday",
      "and nobody thought to warn the maize.",
      "By evening the whole valley was a mirror,",
      "showing the sky things it had never asked to see.",
      "We lost two goats and a fence.",
      "We gained, for one week only,",
      "a lake with our name on it,",
      "and a story we are still finishing.",
    ]
  },
  {
    title: "Inheritance",
    lines: [
      "My father gave me his handshake,",
      "his habit of arriving early to funerals,",
      "and a silence so well-built",
      "I mistook it for peace until I was twenty-six.",
      "He also gave me, without meaning to,",
      "the exact tilt of his head",
      "when he's decided not to argue anymore.",
      "I use it on my own son now.",
      "He hates it the way I did.",
      "Good. That means it's working.",
    ]
  },
  {
    title: "My Father's Silence",
    lines: [
      "He answered most questions with weather —",
      "\"looks like rain,\" he'd say, meaning *I don't know*,",
      "meaning *ask your mother*,",
      "meaning *I am afraid of getting this wrong in front of you*.",
      "I used to think he was withholding.",
      "Now I think he was translating,",
      "badly, from a language",
      "no one had taught him the words for love in.",
    ]
  },
  {
    title: "The Recipe She Never Wrote",
    lines: [
      "Ask her for the amounts and she'll say",
      "\"until it looks right\" —",
      "a measurement no scale has ever held.",
      "I have tried to write it down for years:",
      "a handful, a pinch, \"you'll know.\"",
      "The paper stays mostly empty.",
      "Maybe that's the real recipe —",
      "not the stew,",
      "but learning to trust a hand",
      "you watched cook for thirty years",
      "before you ever held the spoon yourself.",
    ]
  },
  {
    title: "Rongai at Rush Hour",
    lines: [
      "Six of us where five should sit,",
      "someone's elbow filing a complaint",
      "against someone's ribs,",
      "the conductor collecting fifty bob",
      "like it's a toll on patience itself.",
      "Outside, the jam doesn't move",
      "so much as it thinks about moving,",
      "and thinks better of it.",
      "We arrive home the same people",
      "we left as, just more folded.",
    ]
  },
  {
    title: "Data Bundle",
    lines: [
      "1GB, and I spend the first 200MB",
      "deciding what's worth the rest of it —",
      "which notification, which video,",
      "which small proof that somewhere",
      "someone is thinking of me.",
      "By Thursday I'm rationing affection",
      "the way my grandmother rationed sugar:",
      "carefully, and only for the tea",
      "that really needs it.",
    ]
  },
  {
    title: "Landlord's Grace Period",
    lines: [
      "He says the fifth, he means the third,",
      "and by the third he's already composed",
      "the message he'll send on the fourth.",
      "I have learned to read a landlord",
      "the way sailors read weather —",
      "not what he says,",
      "but the pressure behind it.",
      "Rent is due.",
      "So, apparently, is patience.",
    ]
  },
  {
    title: "Insomnia, Explained to No One",
    lines: [
      "It isn't that I can't sleep.",
      "It's that 2 a.m. is the only appointment",
      "nobody else wants,",
      "so it's finally quiet enough",
      "for me to keep it.",
      "The house exhales.",
      "The fridge hums its one flat note.",
      "I lie there, doing the specific arithmetic",
      "of things I said and can't unsay.",
      "The moon doesn't mind the company.",
      "It's had worse.",
    ]
  },
  {
    title: "The Moon Keeps Office Hours",
    lines: [
      "Every night, without complaint,",
      "it shows up for a shift",
      "nobody's thanked it for in centuries.",
      "Rising over the savanna the same",
      "as it rises over the skyline —",
      "no favorites, no overtime pay,",
      "just the quiet insistence",
      "that the dark shouldn't go",
      "completely unattended.",
    ]
  },
  {
    title: "Long Distance",
    lines: [
      "We measure love now in megabytes and time zones,",
      "in the seven-hour gap where my good morning",
      "lands in your Tuesday afternoon",
      "like a letter mailed to the wrong decade.",
      "I have gotten good at loving you",
      "in the past tense of your day",
      "and the future tense of mine.",
      "Neither of us has found the word yet",
      "for missing someone",
      "you're still, technically, talking to.",
    ]
  },
  {
    title: "What I Kept",
    lines: [
      "Not the ring. Not the photos, even —",
      "those went into a folder I don't open.",
      "I kept the way you said \"eventually\"",
      "like it was a place we were both driving to.",
      "I kept the recipe for the eggs you made badly",
      "on purpose, so I'd laugh instead of leaving.",
      "Small things.",
      "The kind that don't look like evidence",
      "until someone asks what happened,",
      "and you realize you've been building a case",
      "out of tenderness the whole time.",
    ]
  },
  {
    title: "The Last Text",
    lines: [
      "It said \"call me when you're free,\"",
      "which is the least dramatic sentence",
      "to end a whole chapter on.",
      "I have read it more times",
      "than the message deserves.",
      "Not for meaning —",
      "there wasn't much left to find —",
      "but for the timestamp,",
      "which is the only proof I have",
      "that this was, for a while,",
      "still ongoing.",
    ]
  },
  {
    title: "The Chair We Don't Move",
    lines: [
      "Nobody voted on it.",
      "It just happened —",
      "the chair at the end of the table",
      "stopped being furniture",
      "and became a kind of shrine",
      "with terrible posture.",
      "We set a plate there twice, out of habit,",
      "before we remembered.",
      "Grief, it turns out,",
      "has a longer memory",
      "than we do.",
    ]
  },
  {
    title: "Burial Season",
    lines: [
      "They say it comes in threes,",
      "like it's being polite,",
      "spacing out the bad news",
      "so the village has time to breathe",
      "between one black cloth and the next.",
      "We buried the old man in July,",
      "his sister in August,",
      "and by September",
      "nobody was surprised anymore,",
      "just tired",
      "in a way that outlasted the tiredness itself.",
    ]
  },
  {
    title: "His Voicemail",
    lines: [
      "I called it once by accident",
      "and let it play the whole way through,",
      "just to hear him say \"leave a message\"",
      "in a voice that didn't yet know",
      "it wouldn't need to.",
      "I didn't leave one.",
      "What would I even say",
      "to a man who's already",
      "finished the sentence",
      "better than I could?",
    ]
  },
  {
    title: "Tuesday, the Least Dramatic Day",
    lines: [
      "We left on a Tuesday on purpose —",
      "no fanfare, no long goodbye at the gate,",
      "just a bag, a bus, and a mother",
      "pretending to check the stove",
      "so she wouldn't have to watch us go.",
      "Some departures deserve music.",
      "Ours deserved nothing",
      "but the ordinary hum of a day",
      "that didn't know",
      "it was about to become a hinge.",
    ]
  },
  {
    title: "Border Crossing",
    lines: [
      "The officer asks the purpose of my visit",
      "and I give him the short answer —",
      "work — because the long one",
      "involves a mother, a debt, and a promise",
      "that fits badly into any of his boxes.",
      "The stamp goes in.",
      "Somewhere behind me,",
      "a line I didn't choose to be born on",
      "gets a little more real,",
      "and a little more ignored",
      "by the wind that crosses it for free.",
    ]
  },
  {
    title: "What the Photograph Doesn't Say",
    lines: [
      "In the picture, everyone is smiling,",
      "which is the photograph's whole job",
      "and its only lie.",
      "You can't see that Uncle James",
      "left early because of an argument.",
      "You can't hear the joke that made",
      "my mother's smile the real one",
      "instead of the one she gives the camera.",
      "We keep it anyway.",
      "Some truths are worth",
      "a small, well-composed dishonesty.",
    ]
  },
  {
    title: "Ten Minutes Fast",
    lines: [
      "My father's clock ran ahead on purpose —",
      "his one hedge against a world",
      "that kept almost making him late.",
      "I inherited the habit,",
      "not the clock.",
      "My phone says 6:45;",
      "in my head, it's already 6:55,",
      "and I am already, quietly, running.",
    ]
  },
  {
    title: "Childhood Kitchen",
    lines: [
      "I can't tell you the measurements,",
      "but I can tell you the sound —",
      "oil deciding to be hot,",
      "a wooden spoon negotiating with a pot,",
      "my grandmother humming something",
      "she'd deny knowing the words to",
      "if you asked her directly.",
      "The kitchen is gone now,",
      "renovated by people",
      "who never smelled what I'm describing.",
      "The sound, somehow, survived the sale.",
    ]
  },
  {
    title: "Interview Season",
    lines: [
      "I have practiced my strengths",
      "until they sound like confessions,",
      "and my weaknesses",
      "until they sound like strengths",
      "wearing a disguise.",
      "\"Where do you see yourself in five years,\"",
      "they ask, and I want to say",
      "*employed, mostly, and less afraid* —",
      "but that's not an answer",
      "they've built a box for yet.",
    ]
  },
  {
    title: "The Office Plant",
    lines: [
      "It has survived three rounds of layoffs,",
      "two changes of management,",
      "and one entire year",
      "where nobody remembered to water it",
      "except out of guilt on a Friday.",
      "I identify with the plant.",
      "We are both still here",
      "mostly because",
      "no one's gotten around",
      "to deciding we shouldn't be.",
    ]
  },
  {
    title: "Seed Money",
    lines: [
      "Nobody claps for the planting.",
      "They save that for the harvest,",
      "as if the seed didn't do",
      "the frightening part alone,",
      "underground, in the dark,",
      "betting on a season",
      "it couldn't see yet.",
      "I am trying to learn",
      "to be proud of the planting.",
      "The harvest, if it comes,",
      "was never really the hard part.",
    ]
  },
  {
    title: "After the Drought",
    lines: [
      "The first rain doesn't fall so much",
      "as it apologizes,",
      "one drop at a time,",
      "like it knows it's late",
      "and isn't sure it'll be believed.",
      "The soil forgives fast.",
      "It always does.",
      "Some of us are still working",
      "on that particular skill.",
    ]
  },
  {
    title: "The Sound an Empty House Makes",
    lines: [
      "It isn't silence.",
      "It's the fridge, the roof settling,",
      "a tap two rooms away",
      "clearing its throat.",
      "I used to think I wanted quiet.",
      "Turns out I wanted company",
      "that didn't ask anything of me —",
      "and an empty house, it happens,",
      "is the only guest",
      "that fits that description exactly.",
    ]
  },
  {
    title: "Company",
    lines: [
      "Solitude and loneliness",
      "share an address",
      "but keep very different hours.",
      "One of them makes tea",
      "and reads by the window,",
      "unbothered.",
      "The other one",
      "just sits there,",
      "waiting for the phone",
      "to become a person.",
      "I am trying to be",
      "better roommates",
      "with the first one.",
    ]
  },
  {
    title: "Harmattan",
    lines: [
      "The dust arrives before the season does,",
      "settling on everything —",
      "the car, the washing line,",
      "the photograph of a man",
      "none of us are ready to stop dusting.",
      "It gets in your throat, your eyes,",
      "the corners of arguments",
      "you thought you'd finished having.",
      "We call it the dry season.",
      "Really, it's just the year",
      "clearing its throat",
      "before it says something difficult.",
    ]
  },
  {
    title: "First Rain",
    lines: [
      "It doesn't knock.",
      "It just arrives on the tin roof",
      "like a whole percussion section",
      "that skipped rehearsal",
      "and is showing off anyway.",
      "Within a minute, every child in the estate",
      "is standing in it on purpose,",
      "and every mother is shouting",
      "a warning she doesn't fully mean.",
    ]
  },
  {
    title: "Candle at the Window",
    lines: [
      "We light it when someone's still out,",
      "still on the road, still not accounted for —",
      "a small fire standing guard",
      "against a dark that doesn't actually",
      "mean any harm, probably,",
      "but hasn't proven it yet.",
      "It burns down slowly,",
      "patient in the specific way",
      "that waiting mothers",
      "and old candles",
      "have both had to learn.",
    ]
  },
  {
    title: "Ember",
    lines: [
      "Long after the fire's stopped",
      "announcing itself,",
      "the ember keeps the whole conversation going",
      "quietly, under the ash,",
      "in case anyone still needs the warmth",
      "more than they need the show.",
      "I want to be that,",
      "eventually —",
      "less flame, more ember.",
      "Less performance.",
      "More staying lit.",
    ]
  },
  {
    title: "The Acacia's Patience",
    lines: [
      "It doesn't hurry toward the rain.",
      "It just stands there,",
      "flat-canopied, unimpressed by drought,",
      "the way an elder stands",
      "through an argument",
      "he's already decided",
      "isn't worth raising his voice for.",
      "Shade arrives eventually.",
      "It always has,",
      "for everyone who waited",
      "under that particular tree.",
    ]
  },
  {
    title: "Nest, Twice Built",
    lines: [
      "The wind took the first one",
      "in a single afternoon,",
      "no warning, no negotiation.",
      "The bird built again anyway,",
      "lower this time, better anchored,",
      "in the fork instead of the tip,",
      "having learned exactly one lesson",
      "and applied it completely.",
      "I am trying to build",
      "like that bird —",
      "smarter the second time,",
      "not smaller in ambition,",
      "just less naive about the wind.",
    ]
  },
  {
    title: "Code-Switch",
    lines: [
      "At home it's one language for feeling",
      "and another for facts —",
      "love in the mother tongue,",
      "rent and receipts in English,",
      "as if money doesn't trust",
      "the softer language",
      "to hold its weight.",
      "I catch myself mid-sentence sometimes,",
      "not sure which self",
      "was supposed to finish it.",
    ]
  },
  {
    title: "What My Name Costs",
    lines: [
      "Every new classroom, every clinic,",
      "every roll call said carefully wrong",
      "by someone trying, at least,",
      "to get close.",
      "I used to correct them every time.",
      "Now I pick my battles —",
      "which is its own kind of tax,",
      "paid quietly,",
      "by anyone whose name",
      "came from somewhere",
      "this room didn't expect.",
    ]
  },
  {
    title: "Mother Tongue, Untaught",
    lines: [
      "I understand it better than I speak it,",
      "which is its own particular grief —",
      "a whole room of meaning",
      "I can enter",
      "but not furnish.",
      "My grandmother tells her best jokes in it.",
      "I laugh a half-second late,",
      "translating in my head,",
      "grateful, and a little ashamed,",
      "that laughter is the one thing",
      "that still arrives on time.",
    ]
  },
  {
    title: "Both Rooms",
    lines: [
      "I was raised in two rooms at once —",
      "one lit by a fire that told stories",
      "older than anyone in it,",
      "one lit by a screen",
      "that answers faster than it understands.",
      "I don't choose between them anymore.",
      "I just leave the door open,",
      "and let whichever room",
      "has something worth saying",
      "speak first.",
    ]
  },
  {
    title: "Mweshimiwa",
    lines: [
      "They named me the honoured one",
      "before I'd done anything",
      "to earn or disprove it —",
      "which is either the kindest",
      "or the most dangerous thing",
      "a family can hand a child.",
      "I've spent the years since",
      "trying to grow into it sideways,",
      "the way you grow into a coat",
      "bought two sizes too big",
      "by someone who believed in you early.",
    ]
  },
  {
    title: "The Seam",
    lines: [
      "Somewhere between the parchment and the terminal,",
      "between the elder's proverb and the notification,",
      "there's a seam —",
      "not a wall, not a border,",
      "just the place where one voice",
      "hands the sentence to the other",
      "without either of them noticing",
      "the handoff happened.",
      "I live exactly there.",
      "Most days, it's the only address",
      "that's ever fully fit.",
    ]
  },
  {
    title: "Instructions for the Next Version of Me",
    lines: [
      "Keep the handshake. Lose the flinching.",
      "Keep the mother tongue, even the half of it",
      "you're still translating badly.",
      "Keep the habit of arriving early —",
      "not out of anxiety this time,",
      "just respect.",
      "When the city gets loud,",
      "remember the acacia.",
      "It didn't hurry either,",
      "and it's still standing,",
      "still exactly where the shade is needed.",
    ]
  },
];

function renderPoems(){
  const grid = document.getElementById('poem-grid');
  grid.innerHTML = POEMS.map(p => `
    <article class="poem-card">
      <h3>${escapeHTML(p.title)}</h3>
      <pre>${p.lines.map(escapeHTML).join('\n')}</pre>
      <p class="poem-rights">© ${new Date().getFullYear()} Emmanuel Mwendwa (Mweshimiwa / Mwesh)</p>
    </article>
  `).join('');
}
function escapeHTML(str){
  return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

renderPoems();

/* ============================================================
   SCROLL REVEAL — registered EARLY and guarded so the page can
   never stay stuck hidden (opacity:0) because of an error in a
   feature further down this file.
   ============================================================ */
function setupScrollReveal(){
  const revealItems = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window && revealItems.length){
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealItems.forEach(el => io.observe(el));
  } else {
    revealItems.forEach(el => el.classList.add('in-view'));
  }
}
setupScrollReveal();

/* ---------- NOTIFY FORM (placeholder — wire to your own list) ---------- */
document.getElementById('notify-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const status = document.getElementById('notify-status');
  // TODO: replace with a real request to your mailing list / form backend
  status.textContent = "Thanks — you'll hear from us when The Heart is ready.";
  e.target.reset();
});

/* ---------- WRITE WITH ME — local neural continuation ---------- */
/* This runs ENTIRELY in the browser through nn-engine.js + the trained
   weights in this folder. No API, no server call, no fallback templates —
   the model does the work or nothing does. */
async function generateNextLine(history){
  const engine = await mweshNeuralEngineReady;
  if(!engine) throw new Error('local model unavailable');
  const line = engine.generate(history);
  if(!line) throw new Error('local model returned nothing');
  return line;
}

const collabHint = document.getElementById('collab-hint');
const collabSend = document.getElementById('collab-send');
mweshNeuralEngineReady.then(engine => {
  collabSend.disabled = !engine;
  collabHint.textContent = engine
    ? "Mwesh's local model is loaded — this runs in your browser only. No API, nothing leaves the page."
    : "The local model files couldn't load from this page. Serve the folder over http (python -m http.server 8000) and reload.";
  if(engine) {
    const allLines = POEMS.flatMap(p => p.lines);
    engine.setPoemLines(allLines);
  }
}).catch(() => {
  collabSend.disabled = true;
  collabHint.textContent = "The local model files couldn't load from this page. Serve the folder over http (python -m http.server 8000) and reload.";
});

const collabThread = document.getElementById('collab-thread');
const collabInput = document.getElementById('collab-input');
const collabHistory = [];

function addCollabLine(text, who){
  const p = document.createElement('p');
  p.className = `collab-line ${who}`;
  p.textContent = text;
  collabThread.appendChild(p);
  collabThread.scrollTop = collabThread.scrollHeight;
}

document.getElementById('collab-send').addEventListener('click', async () => {
  const text = collabInput.value.trim();
  if(!text) return;
  addCollabLine(text, 'user');
  collabHistory.push(text);
  collabInput.value = '';
  collabInput.disabled = true;
  try{
    const next = await generateNextLine(collabHistory);
    addCollabLine(next, 'bot');
    collabHistory.push(next);
    collabInput.disabled = false;
    collabInput.focus();
  }catch(error){
    collabInput.disabled = false;
    collabHint.textContent = error.message === 'local model unavailable'
      ? "The local model can't run here — the model files must be served over http."
      : "The local model didn't produce a line — try again.";
  }
});
collabInput.addEventListener('keydown', (e) => {
  if(e.key === 'Enter' && !e.shiftKey){
    e.preventDefault();
    document.getElementById('collab-send').click();
  }
});

/* ============================================================
   RECITE — entirely client-side text-to-speech, tuned to sound
   like a reading rather than a screen-reader:
   - queues one utterance PER LINE (not one huge blob), so the
     engine takes a natural breath/pause between lines
   - lets the reader pick an actual voice, since the browser's
     default pick is often the flattest one installed
   - highlights the line currently being spoken
   ============================================================ */
const reciteInput = document.getElementById('recite-input');
const reciteRate = document.getElementById('recite-rate');
const recitePitch = document.getElementById('recite-pitch');
const reciteVoiceSelect = document.getElementById('recite-voice');
const poemDisplay = document.getElementById('poem-display');

// The whole recitation feature is guarded: if the browser has no
// speechSynthesis (or it throws), the rest of the page still works.
try{

let availableVoices = [];
let reciteQueue = [];
let reciteIndex = 0;
let isReciting = false;

function pickBestDefaultVoice(voices){
  // Prefer voices that tend to sound less robotic: modern "Natural"/
  // "Neural" builds, Google's voices, then any English voice, then whatever exists.
  const englishVoices = voices.filter(v => v.lang && v.lang.startsWith('en'));
  const pool = englishVoices.length ? englishVoices : voices;
  const scored = pool.map(v => {
    const name = v.name.toLowerCase();
    let score = 0;
    if(name.includes('natural')) score += 3;
    if(name.includes('neural')) score += 3;
    if(name.includes('google')) score += 2;
    if(name.includes('online')) score += 1;
    if(v.localService === false) score += 1; // often higher-quality cloud voices
    return { v, score };
  });
  scored.sort((a,b) => b.score - a.score);
  return scored[0] ? scored[0].v : pool[0];
}

function populateVoiceList(){
  availableVoices = window.speechSynthesis.getVoices();
  if(!availableVoices.length) return;
  reciteVoiceSelect.innerHTML = availableVoices
    .map((v, i) => `<option value="${i}">${v.name} (${v.lang})</option>`)
    .join('');
  const best = pickBestDefaultVoice(availableVoices);
  const bestIndex = availableVoices.indexOf(best);
  if(bestIndex > -1) reciteVoiceSelect.value = String(bestIndex);
}
populateVoiceList();
if('onvoiceschanged' in window.speechSynthesis){
  window.speechSynthesis.onvoiceschanged = populateVoiceList;
}

function renderPoemDisplay(lines){
  poemDisplay.innerHTML = lines
    .map((line, i) => `<p class="p-line" data-i="${i}">${escapeHTML(line) || '&nbsp;'}</p>`)
    .join('');
}

function pauseForLine(line){
  const trimmed = line.trim();
  if(!trimmed) return 500; // stanza break
  const last = trimmed[trimmed.length - 1];
  if(last === '.' || last === '!' || last === '?') return 420;
  if(last === ',' || last === ';' || last === ':') return 260;
  return 160;
}

function speakLine(){
  if(reciteIndex >= reciteQueue.length){
    isReciting = false;
    return;
  }
  const line = reciteQueue[reciteIndex];
  const allLines = poemDisplay.querySelectorAll('.p-line');
  allLines.forEach((el, i) => {
    el.classList.toggle('active', i === reciteIndex);
    el.classList.toggle('done', i < reciteIndex);
  });

  if(!line.trim()){
    reciteIndex++;
    setTimeout(speakLine, 500); // longer pause on blank lines, like a stanza break
    return;
  }

  const utterance = new SpeechSynthesisUtterance(line.trim());
  const chosen = availableVoices[parseInt(reciteVoiceSelect.value, 10)];
  if(chosen) utterance.voice = chosen;
  // small human-like variance so every line doesn't land at the exact same
  // rate/pitch — real readers drift slightly line to line
  const jitterRate = (Math.random() - 0.5) * 0.06;
  const jitterPitch = (Math.random() - 0.5) * 0.08;
  utterance.rate = Math.max(0.4, parseFloat(reciteRate.value) + jitterRate);
  utterance.pitch = Math.max(0.5, parseFloat(recitePitch.value) + jitterPitch);
  utterance.onend = () => {
    reciteIndex++;
    setTimeout(speakLine, pauseForLine(line));
  };
  utterance.onerror = () => { reciteIndex++; speakLine(); };
  window.speechSynthesis.speak(utterance);
}

document.getElementById('recite-play').addEventListener('click', () => {
  const text = reciteInput.value.trim();
  if(!text) return;
  window.speechSynthesis.cancel();
  reciteQueue = text.split('\n');
  reciteIndex = 0;
  isReciting = true;
  renderPoemDisplay(reciteQueue);
  speakLine();
});
document.getElementById('recite-stop').addEventListener('click', () => {
  window.speechSynthesis.cancel();
  isReciting = false;
  poemDisplay.querySelectorAll('.p-line.active').forEach(el => el.classList.remove('active'));
});
} catch(err){
  /* recitation unavailable — poems, collab, and the rest still work */
}

/* ---------- mobile nav toggle ---------- */
const navToggle = document.getElementById('nav-toggle');
const navLinksWrap = document.getElementById('nav-links');
navToggle.addEventListener('click', () => {
  const open = navLinksWrap.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(open));
});
navLinksWrap.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    navLinksWrap.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

/* ---------- scroll progress bar ---------- */
const scrollProgress = document.getElementById('scroll-progress');
function updateScrollProgress(){
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  scrollProgress.style.width = pct + '%';
}
window.addEventListener('scroll', updateScrollProgress, { passive: true });
updateScrollProgress();

/* ---------- nav active-link scroll spy ---------- */
const navLinks = document.querySelectorAll('.topnav a[href^="#"]');
const navTargets = Array.from(navLinks)
  .map(a => document.querySelector(a.getAttribute('href')))
  .filter(Boolean);
if('IntersectionObserver' in window && navTargets.length){
  const spy = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const link = document.querySelector(`.topnav a[href="#${entry.target.id}"]`);
      if(!link) return;
      if(entry.isIntersecting) link.classList.add('active');
      else link.classList.remove('active');
    });
  }, { rootMargin: '-45% 0px -45% 0px' });
  navTargets.forEach(t => spy.observe(t));
}