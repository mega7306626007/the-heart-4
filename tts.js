/* ============================================================
   MWESH VOICE — tts.js
   Frontend audio player for poem recitation.
   Connects to the local TTS server (tts-server.py) for
   custom voice playback, with Web Speech API fallback.
   ============================================================ */

const MweshVoice = (() => {
  // Config
  const TTS_SERVER = 'http://localhost:5111';
  const HEALTH_CHECK_TIMEOUT = 2000;
  // ONE voice with ALL poets patterns — single, unified reciter (was 2M2F)
  const VOICES_4 = {
    lessac: { label: 'Mwesh — poetic (all poets)', gender: 'M' },
  };
  const DEFAULT_VOICE = 'lessac';

  // State
  let serverAvailable = false;
  let currentAudio = null;
  let currentButton = null;
  let currentCard = null;
  let currentVoice = localStorage.getItem('mweshVoice') || DEFAULT_VOICE;
  if (!VOICES_4[currentVoice]) currentVoice = DEFAULT_VOICE;

  // ---------- Server Detection ----------
  async function checkServer() {
    try {
      const res = await fetch(`${TTS_SERVER}/health`, {
        signal: AbortSignal.timeout(HEALTH_CHECK_TIMEOUT)
      });
      const data = await res.json();
      serverAvailable = data.ok === true;
    } catch {
      serverAvailable = false;
    }
    return serverAvailable;
  }

  // ---------- Audio Playback ----------
  async function speakPoem(text, button, card) {
    // Stop any current playback
    stop();

    currentButton = button;
    currentCard = card;

    // Update UI
    button.textContent = '◼ Stop';
    button.classList.add('playing');
    if (card) card.classList.add('reciting');

    // Re-check server if it was unavailable at load (server may have started since)
    if (!serverAvailable) {
      await checkServer();
      updateVoiceHint();
    }
    console.log('[MweshVoice] speaking with voice', currentVoice, 'server', serverAvailable);

    if (serverAvailable) {
      await speakViaServer(text);
    } else {
      speakViaBrowser(text);
    }
  }

  async function speakViaServer(text) {
    try {
      const res = await fetch(`${TTS_SERVER}/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: currentVoice })
      });

      if (!res.ok) throw new Error('Server error');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      currentAudio = new Audio(url);
      currentAudio.onended = () => {
        resetUI();
        URL.revokeObjectURL(url);
      };
      currentAudio.onerror = () => {
        resetUI();
        URL.revokeObjectURL(url);
      };
      currentAudio.play();

    } catch (err) {
      console.error('TTS server error, falling back to browser:', err);
      speakViaBrowser(text);
    }
  }

  function speakViaBrowser(text) {
    if (!('speechSynthesis' in window)) {
      alert('Your browser does not support speech synthesis.');
      resetUI();
      return;
    }

    // Fallback: honour the 2M2F selector even without Piper, by picking browser voice gender
    const voices = speechSynthesis.getVoices();
    const wantFemale = VOICES_4[currentVoice]?.gender === 'F';
    let preferred = null;
    if (wantFemale) {
      preferred = voices.find(v => v.lang.startsWith('en') && /female|amy|kathleen|samantha|zira/i.test(v.name))
               || voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('female'))
               || voices.find(v => v.lang.startsWith('en'));
    } else {
      preferred = voices.find(v => v.lang.startsWith('en') && /male|lessac|ryan|david|mark/i.test(v.name))
               || voices.find(v => v.lang.startsWith('en'));
    }
    if (!preferred) preferred = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en')) || voices[0];

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = preferred;
    utterance.rate = 0.78;
    utterance.pitch = 0.95;

    utterance.onend = () => resetUI();
    utterance.onerror = () => resetUI();

    currentAudio = { cancel: () => speechSynthesis.cancel() };
    speechSynthesis.speak(utterance);
  }

  function stop() {
    if (currentAudio) {
      if (currentAudio instanceof Audio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      } else if (currentAudio.cancel) {
        currentAudio.cancel();
      }
      currentAudio = null;
    }
    resetUI();
  }

  function resetUI() {
    if (currentButton) {
      currentButton.textContent = '▶ Listen';
      currentButton.classList.remove('playing');
    }
    if (currentCard) {
      currentCard.classList.remove('reciting');
    }
    currentButton = null;
    currentCard = null;
    currentAudio = null;
  }

  // ---------- 4-Voice Selector (2M2F) ----------
  function createVoiceSelector() {
    if (document.getElementById('mwesh-voice-selector')) return;
    const poemsSection = document.getElementById('poems');
    if (!poemsSection) return;
    const bar = document.createElement('div');
    bar.id = 'mwesh-voice-selector';
    bar.className = 'voice-selector';
    bar.innerHTML = `
      <label for="mwesh-voice">Reciter voice:</label>
      <select id="mwesh-voice" aria-label="Choose reciter voice">
        ${Object.entries(VOICES_4).map(([id, v]) => `<option value="${id}" ${id===currentVoice?'selected':''}>${v.label}</option>`).join('')}
      </select>
      <span class="voice-hint">${serverAvailable ? 'via Piper (local)' : 'browser fallback if server off'}</span>
    `;
    const grid = document.getElementById('poem-grid');
    if (grid) poemsSection.insertBefore(bar, grid);
    else poemsSection.appendChild(bar);
    const sel = bar.querySelector('#mwesh-voice');
    sel.addEventListener('change', (e) => {
      currentVoice = e.target.value;
      localStorage.setItem('mweshVoice', currentVoice);
      console.log('[MweshVoice] voice changed to', currentVoice);
      // Re-check server so hint updates and next play uses correct voice
      checkServer().then(updateVoiceHint);
      // If a poem is currently playing, stop it so next click uses new voice
      stop();
    });
  }

  function updateVoiceHint() {
    const hint = document.querySelector('#mwesh-voice-selector .voice-hint');
    if (hint) hint.textContent = serverAvailable ? 'via Piper (local 2M2F)' : 'browser fallback if server off';
  }

  // ---------- UI Creation ----------
  function createListenButton(poemIndex) {
    const btn = document.createElement('button');
    btn.className = 'listen-btn';
    btn.textContent = '▶ Listen';
    btn.setAttribute('aria-label', 'Listen to this poem');
    btn.dataset.poemIndex = poemIndex;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (btn.classList.contains('playing')) {
        stop();
        return;
      }

      // Stop any other playing poem
      document.querySelectorAll('.listen-btn.playing').forEach(b => {
        b.textContent = '▶ Listen';
        b.classList.remove('playing');
      });
      document.querySelectorAll('.poem-card.reciting').forEach(c => {
        c.classList.remove('reciting');
      });

      // Get poem text
      const card = btn.closest('.poem-card');
      const pre = card.querySelector('pre');
      if (pre) {
        speakPoem(pre.textContent, btn, card);
      }
    });

    return btn;
  }

  // ---------- Initialization ----------
  function init() {
    // Check if TTS server is running
    checkServer().then(available => {
      if (available) {
        console.log('[MweshVoice] TTS server connected at', TTS_SERVER, 'voices', Object.keys(VOICES_4), 'current', currentVoice);
      } else {
        console.log('[MweshVoice] TTS server not found, using browser speech');
      }
      updateVoiceHint();
    });
    createVoiceSelector();

    // Add listen buttons to all poem cards
    const poemCards = document.querySelectorAll('.poem-card');
    poemCards.forEach((card, index) => {
      const btn = createListenButton(index);
      card.appendChild(btn);
    });

    // Preload voices for browser fallback
    if ('speechSynthesis' in window) {
      speechSynthesis.getVoices();
      speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
    }
  }

  // ---------- Public API ----------
  return {
    init,
    checkServer,
    stop,
    isServerAvailable: () => serverAvailable
  };
})();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', MweshVoice.init);
} else {
  MweshVoice.init();
}
