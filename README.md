# Mwesh

Mwesh is a static poetry site with a character-level neural poem continuation
engine that runs entirely in the browser. No remote service or server is required
for the writing experience.

## Files
- `index.html`, `styles.css`, `script.js` — the browser experience.
- `hero-*.svg`, `book-cover.svg`, `favicon.svg` — visual assets used by the site.
- `nn-engine.js` — browser-side LSTM inference using the trained model files.
- `mwesh-original-poems.md` — the original poem source brought into this project.
- `mwesh_weights.bin`, `nn-manifest.json` — trained model artifacts retained for
  browser inference or future neural-engine integration.

## What's included
- **Local inference** — the model weights never leave the visitor's browser.

## Run it locally
```bash
cd "the heart 4"
python -m http.server 8000
```

Open `http://localhost:8000/` in your browser. The model files must be served
over HTTP because browsers block binary fetches from `file://` pages.
