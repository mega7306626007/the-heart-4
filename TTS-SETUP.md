# Mwesh Poetry Voice System

A local voice recitation system that lets visitors listen to poems read in your actual voice.

## How It Works

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Website         │ ──► │  TTS Server  │ ──► │  Voice Model    │
│  "Listen" button │     │  localhost   │     │  (your voice)   │
└─────────────────┘     └──────────────┘     └─────────────────┘
        │                      │                      │
        │                      │                      │
        ▼                      ▼                      ▼
   Audio plays          Text → Speech         Trained on your
   in browser           Generated locally     recordings
```

**No APIs. No purchases. No data leaves your computer.**

## Quick Start

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 2. Record Your Voice

```bash
python record-voice.py
```

This will:
- Open your microphone
- Show you sentences to read
- Record 40 samples (~15-20 minutes)
- Save everything to `voice-samples/`

**Tips for recording:**
- Find a quiet room
- Speak naturally, like reciting poetry
- Each recording is 5-10 seconds
- Press Enter to start, stop talking for 1.5s to auto-stop
- Re-record any bad ones by running the script again

### 3. Train Your Voice Model

```bash
python train-voice.py
```

This will:
- Take your recordings
- Train a Piper voice model
- Save the model to `voices/`

**Training time:** 1-3 hours (depends on your hardware)
- GPU: ~1 hour
- CPU: ~3 hours (still works, just slower)

### 4. Start the Voice Server

```bash
python tts-server.py
```

This runs a local server on `http://localhost:5111`.

### 5. Use the Website

1. Open `index.html` in your browser
2. Click "Listen" on any poem
3. The poem plays in your voice

## File Structure

```
the heart 4/
├── tts-server.py          # Voice server (runs locally)
├── record-voice.py        # Record voice samples
├── train-voice.py         # Train voice model
├── requirements.txt       # Python dependencies
├── tts.js                 # Frontend audio player
├── voices/                # Trained voice models
│   └── mwesh.onnx
├── voice-samples/         # Your recordings
│   ├── sample_001.wav
│   ├── sample_002.wav
│   └── metadata.jsonl
└── voice-cache/           # Cached audio (auto-created)
```

## Troubleshooting

### "No microphone found"
- Check your microphone is connected
- Try: `python -c "import sounddevice; print(sounddevice.query_devices())"`

### "No .onnx voice model found"
- Run `record-voice.py` first
- Then run `train-voice.py`

### Training is slow
- Normal on CPU (3+ hours)
- Check if GPU is available: `python -c "import torch; print(torch.cuda.is_available())"`

### Audio sounds robotic
- Record more samples (run `record-voice.py` again)
- Train for more epochs (edit `train-voice.py`, increase `EPOCHS`)
- Make sure recordings are in a quiet room

### Server won't start
- Check port 5111 isn't in use: `netstat -an | grep 5111`
- Try a different port: edit `tts-server.py`, change `PORT = 5111`

## How the Voice Model Works

The system uses **Piper TTS**, an open-source text-to-speech engine that:

1. **Records** your voice saying specific sentences
2. **Trains** a neural network to match your voice patterns
3. **Generates** new speech from any text

The trained model captures:
- Your pitch and tone
- How you pronounce words
- Your natural rhythm and pacing
- Emotional inflection

## Advanced Options

### Custom Voice Settings

Edit `tts-server.py` to change defaults:

```python
DEFAULT_SPEED = 1.0    # 0.5 = slow, 1.5 = fast
DEFAULT_PITCH = 1.0    # 0.8 = deep, 1.2 = high
```

### Multiple Voices

Record different voices in separate folders:

```bash
python record-voice.py --output voice-samples-mwesh
python record-voice.py --output voice-samples-other
```

Train each separately and keep multiple `.onnx` files in `voices/`.

### Deploy Online

To make the voice available online (not just locally):

1. Deploy `tts-server.py` to a cloud service (free tier works)
2. Update `tts.js` to point to your server URL
3. Visitors can then listen to poems in your voice

**Note:** The voice model stays on your server, so your voice is protected.

## What's Included

- ✅ Local TTS server (no internet required)
- ✅ Voice recording script
- ✅ Voice training script
- ✅ Frontend audio player
- ✅ Automatic caching (faster repeated plays)
- ✅ Fallback to browser speech if server is off
- ✅ Visual feedback (pulsing button, highlighted poem)

## Cost

**$0.** Everything runs locally on your computer. No APIs, no subscriptions, no data sent anywhere.

## Next Steps

After training, you can:

1. **Test the voice** - Click "Listen" on poems
2. **Adjust speed/pitch** - Edit settings in `tts-server.py`
3. **Record more samples** - Better training = better voice
4. **Deploy online** - Make it available to everyone
5. **Add more poems** - Just add to the `POEMS` array in `script.js`

---

**Questions?** The voice model is yours. Train it, tweak it, make it sound like you.
