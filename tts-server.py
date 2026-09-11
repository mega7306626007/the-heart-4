"""
Mwesh Poetry Voice Server
=========================
Local TTS server using Piper for voice synthesis.
Serves on http://localhost:5111 by default.

Usage:
  python tts-server.py

Requires:
  - Python 3.9+
  - piper-tts (pip install piper-tts)
  - A trained voice model in voices/ directory

The server accepts POST /speak with JSON body:
  { "text": "poem lines here" }

Returns audio/wav stream of the spoken poem.
"""

import io
import os
import sys
import json
import time
import wave
import struct
import hashlib
import threading
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler

# ---------- Config ----------
HOST = "0.0.0.0"
PORT = 5111
VOICE_DIR = Path(__file__).parent / "voices"
CACHE_DIR = Path(__file__).parent / "voice-cache"

# Default voice settings (overridable per-request)
DEFAULT_SPEED = 1.0
DEFAULT_PITCH = 1.0

# ---------- Piper TTS Wrapper (4 voices: 2M+2F) ----------
_piper_models = {}
_piper_lock = threading.Lock()

def load_piper(voice_name=None):
    """Load the Piper TTS model (lazy, per-voice)."""
    global _piper_models
    # Default to lessac (M) if no voice specified - matches 2M2F setup: lessac(M), ryan(M), amy(F), kathleen(F)
    if voice_name is None:
        voice_name = "lessac"
    if voice_name in _piper_models:
        return _piper_models[voice_name]

    with _piper_lock:
        if voice_name in _piper_models:
            return _piper_models[voice_name]

        try:
            from piper import PiperVoice
        except ImportError:
            print("[tts-server] ERROR: piper-tts not installed.")
            print("  Run: pip install piper-tts")
            sys.exit(1)

        # Find the requested voice or fallback to first available
        model_path = VOICE_DIR / f"{voice_name}.onnx"
        if not model_path.exists():
            onnx_files = list(VOICE_DIR.glob("*.onnx"))
            if not onnx_files:
                print(f"[tts-server] ERROR: No .onnx voice model found in {VOICE_DIR}")
                print("  Run train-voice.py first to create one.")
                sys.exit(1)
            model_path = onnx_files[0]
            print(f"[tts-server] Voice '{voice_name}' not found, using {model_path.name}")

        config_path = model_path.with_suffix(".onnx.json")
        if not config_path.exists():
            # Try with .onnx.json double suffix variant
            alt = Path(str(model_path) + ".json")
            if alt.exists():
                config_path = alt
            else:
                config_path = None

        print(f"[tts-server] Loading voice model: {model_path.name}")
        model = PiperVoice.load(
            str(model_path),
            config_path=str(config_path) if config_path and config_path.exists() else None
        )
        print(f"[tts-server] Voice {voice_name} loaded successfully.")
        _piper_models[voice_name] = model
        return model


def synthesize(text, speed=DEFAULT_SPEED, pitch=DEFAULT_PITCH, voice="lessac"):
    """
    Synthesize text to WAV bytes using Piper.
    Returns bytes of a WAV file.
    voice: lessac(M), ryan(M), amy(F), kathleen(F) — 2M2F
    """
    model = load_piper(voice)

    # Clean text: normalize whitespace, handle line breaks for poetry
    lines = text.strip().split("\n")
    # Add pauses between lines (commas create short pauses in Piper)
    clean_lines = []
    for line in lines:
        line = line.strip()
        if line:
            clean_lines.append(line)
    clean_text = ", ".join(clean_lines)

    # Generate audio
    audio_chunks = []
    for chunk in model.synthesize(clean_text):
        audio_chunks.append(chunk.audio_bytes)

    raw_audio = b"".join(audio_chunks)

    # Wrap in WAV format
    wav_buffer = io.BytesIO()
    sample_rate = model.config.sample_rate
    with wave.open(wav_buffer, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)  # 16-bit
        wf.setframerate(sample_rate)
        wf.writeframes(raw_audio)

    return wav_buffer.getvalue()


# ---------- Simple Cache ----------
def get_cache_key(text, speed, pitch):
    """Generate cache key for repeated recitations."""
    raw = f"{text}|{speed}|{pitch}"
    return hashlib.md5(raw.encode()).hexdigest()


# ---------- HTTP Handler ----------
class SpeakHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == "/speak":
            self._handle_speak()
        else:
            self.send_error(404)

    def do_GET(self):
        if self.path == "/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"ok": True, "voice": "loaded"}).encode())
        elif self.path == "/voices":
            self._list_voices()
        else:
            self.send_error(404)

    def _handle_speak(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
            text = body.get("text", "").strip()
            speed = float(body.get("speed", DEFAULT_SPEED))
            pitch = float(body.get("pitch", DEFAULT_PITCH))
            voice = str(body.get("voice", "lessac")).strip().lower()
            if voice not in ["lessac", "ryan", "amy", "kathleen"]:
                voice = "lessac"

            if not text:
                self.send_error(400, "No text provided")
                return

            # Check cache (per voice)
            cache_key = get_cache_key(f"{voice}|{text}", speed, pitch)
            cache_path = CACHE_DIR / f"{cache_key}.wav"
            CACHE_DIR.mkdir(exist_ok=True)

            if cache_path.exists():
                wav_bytes = cache_path.read_bytes()
            else:
                t0 = time.time()
                wav_bytes = synthesize(text, speed, pitch, voice)
                elapsed = time.time() - t0
                print(f"[tts-server] Synthesized {len(text)} chars voice={voice} in {elapsed:.1f}s")

                # Cache it
                cache_path.write_bytes(wav_bytes)

            self.send_response(200)
            self.send_header("Content-Type", "audio/wav")
            self.send_header("Content-Length", str(len(wav_bytes)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(wav_bytes)

        except Exception as e:
            print(f"[tts-server] Error: {e}")
            self.send_error(500, str(e))

    def _list_voices(self):
        """List available voice models."""
        onnx_files = list(VOICE_DIR.glob("*.onnx")) if VOICE_DIR.exists() else []
        voices = [{"name": f.stem, "file": f.name} for f in onnx_files]
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps({"voices": voices}).encode())

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def log_message(self, format, *args):
        """Suppress default logging, use our own."""
        pass


# ---------- Main ----------
if __name__ == "__main__":
    VOICE_DIR.mkdir(exist_ok=True)
    CACHE_DIR.mkdir(exist_ok=True)

    print(f"[tts-server] Mwesh Poetry Voice Server")
    print(f"[tts-server] Listening on http://localhost:{PORT}")
    print(f"[tts-server] Voice models in: {VOICE_DIR}")
    print(f"[tts-server] POST /speak {{\"text\": \"poem here\"}} -> audio/wav")
    print(f"[tts-server] GET /voices -> list available voices")
    print(f"[tts-server] GET /health -> health check")
    print()

    server = HTTPServer((HOST, PORT), SpeakHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[tts-server] Shutting down.")
        server.shutdown()
