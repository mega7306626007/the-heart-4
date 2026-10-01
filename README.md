# Mwesh — The Heart 4

<p align="center">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" />
  <img src="https://img.shields.io/badge/Neural--Engine-In--Browser-8957e5?style=for-the-badge" />
  <img src="https://img.shields.io/badge/No-Server-Required-238636?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Status-Active_Development-ff5e6c?style=for-the-badge" />
</p>

> **A static poetry site with a character-level neural poem continuation engine that runs entirely in the browser. No remote service. No server. The model never leaves the visitor's device.**

Mwesh is where art meets engineering — a poetry experience that writes back.

## The experience

- Read original Mwesh poems
- Watch a neural engine continue them in the browser
- Character-level LSTM inference, fully local
- No API calls. No tracking. No server.

## Files

- `index.html`, `styles.css`, `script.js` — the browser experience
- `hero-*.svg`, `book-cover.svg`, `favicon.svg` — visual assets
- `nn-engine.js` — browser-side LSTM inference using the trained model files
- `mwesh-original-poems.md` — the original poem source
- `mwesh_weights.bin`, `nn-manifest.json` — trained model artifacts for browser inference

## Run it locally

```bash
cd "the heart 4"
python -m http.server 8000
```

Open `http://localhost:8000/` in your browser. The model files must be served over HTTP because browsers block binary fetches from `file://` pages.

## Why it matters

Most "AI art" demos call a cloud API. This one doesn't. The neural engine runs entirely client-side — proof that meaningful creative AI can live in a static site, on any device, offline.

---

*Jijenge. Andika. Acha mashine iandika nawe.*