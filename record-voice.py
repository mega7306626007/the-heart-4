"""
Mwesh Voice Recorder
====================
Interactive script to record voice samples for TTS training.
Records audio from your microphone with automatic silence detection.

Usage:
  python record-voice.py

Requirements:
  pip install sounddevice numpy

Follow the prompts. You'll read sentences one at a time.
Each recording is saved as a WAV file in voice-samples/.
"""

import os
import sys
import json
import time
import wave
import numpy as np
from pathlib import Path

# Config
SAMPLE_RATE = 22050  # Piper expects 22050 Hz
CHANNELS = 1
DTYPE = "int16"
MAX_RECORD_SECONDS = 15
SILENCE_THRESHOLD = 500  # Adjust based on your mic/environment
SILENCE_DURATION = 1.5   # Seconds of silence to stop recording
OUTPUT_DIR = Path(__file__).parent / "voice-samples"

# Training sentences - mix of sounds for good coverage
TRAINING_SENTENCES = [
    # Simple phrases
    "The well does not gossip.",
    "It takes what the bucket brings down.",
    "And gives back only water, level and cold.",
    "My grandmother trusted it more than the church.",
    "The well has never once told me I was asking for too much.",

    # Poetic lines
    "The river keeps the names we forget to say out loud.",
    "Carries them past the bridge, past the last matatu stage.",
    "And still comes back every rain season, asking.",
    "We lost two goats and a fence.",
    "We gained, for one week only, a lake with our name on it.",

    # Daily speech patterns
    "He answered most questions with weather.",
    "Looks like rain, he'd say, meaning I don't know.",
    "Meaning ask your mother.",
    "Meaning I am afraid of getting this wrong in front of you.",

    # Rhythm and pacing
    "Six of us where five should sit.",
    "Someone's elbow filing a complaint against someone's ribs.",
    "The conductor collecting fifty bob like it's a toll on patience itself.",
    "Outside, the jam doesn't move so much as it thinks about moving.",
    "And thinks better of it.",

    # Emotional range
    "I used to think he was withholding.",
    "Now I think he was translating, badly, from a language.",
    "No one had taught him the words for love in.",
    "I use it on my own son now.",
    "He hates it the way I did.",
    "Good. That means it's working.",

    # Variations
    "Ask her for the amounts and she'll say until it looks right.",
    "A measurement no scale has ever held.",
    "I have tried to write it down for years.",
    "A handful, a pinch, you'll know.",
    "The paper stays mostly empty.",

    # Longer sentences
    "It isn't that I can't sleep.",
    "It's that two a.m. is the only appointment nobody else wants.",
    "So it's finally quiet enough for me to keep it.",
    "The house exhales.",
    "The fridge hums its one flat note.",
    "I lie there, doing the specific arithmetic of things I said and can't unsay.",

    # Kreyol/Swahili flavor
    "Every night, without complaint, it shows up for a shift.",
    "Nobody's thanked it for in centuries.",
    "Rising over the savanna the same way it rose over your grandmother's house.",
    "Patient as a debt collector who actually likes you.",

    # Breathing words
    "Haa. Let me think about this.",
    "Mmh, that's not quite right.",
    "Ah, now I understand.",
    "Eeh, that's how it was.",
]


def check_audio():
    """Check if audio device is available."""
    try:
        import sounddevice as sd
        devices = sd.query_devices()
        input_devices = [d for d in devices if d['max_input_channels'] > 0]
        if not input_devices:
            print("ERROR: No microphone found.")
            print("Please connect a microphone and try again.")
            return False
        print(f"Microphone found: {input_devices[0]['name']}")
        return True
    except Exception as e:
        print(f"ERROR: Audio device error: {e}")
        return False


def record_sentence(sentence_num, sentence):
    """Record a single sentence with silence detection."""
    import sounddevice as sd

    print(f"\n{'='*60}")
    print(f"Sentence {sentence_num}/{len(TRAINING_SENTENCES)}:")
    print(f"\n  \"{sentence}\"")
    print(f"\nPress ENTER when ready to record...")
    input()

    print("Recording... (speak clearly, stop when done)")
    print("  Silences of {SILENCE_DURATION}s will auto-stop recording.")

    frames = []
    silent_chunks = 0
    chunk_size = int(SAMPLE_RATE * 0.1)  # 100ms chunks

    def callback(indata, frame_count, time_info, status):
        nonlocal frames, silent_chunks

        if status:
            print(f"  Audio status: {status}")

        audio_data = np.frombuffer(indata, dtype=DTYPE)
        frames.append(audio_data.copy())

        # Check for silence
        rms = np.sqrt(np.mean(audio_data.astype(np.float32) ** 2))
        if rms < SILENCE_THRESHOLD:
            silent_chunks += 1
        else:
            silent_chunks = 0

    try:
        with sd.InputStream(
            samplerate=SAMPLE_RATE,
            channels=CHANNELS,
            dtype=DTYPE,
            callback=callback,
            blocksize=chunk_size,
        ):
            start_time = time.time()
            while True:
                time.sleep(0.1)
                elapsed = time.time() - start_time

                # Auto-stop on long silence
                if silent_chunks >= SILENCE_DURATION * 10:  # 10 chunks per second
                    print(f"  (silence detected, stopping)")
                    break

                # Max duration
                if elapsed >= MAX_RECORD_SECONDS:
                    print(f"  (max duration reached)")
                    break

    except Exception as e:
        print(f"  Recording error: {e}")
        return None

    if not frames:
        print("  No audio recorded.")
        return None

    audio_data = np.concatenate(frames)
    duration = len(audio_data) / SAMPLE_RATE
    print(f"  Recorded {duration:.1f}s of audio.")

    if duration < 0.5:
        print("  Too short. Try again.")
        return None

    return audio_data


def save_recording(audio_data, sentence_num, sentence):
    """Save recording as WAV file."""
    OUTPUT_DIR.mkdir(exist_ok=True)

    filename = f"sample_{sentence_num:03d}.wav"
    filepath = OUTPUT_DIR / filename

    with wave.open(str(filepath), "wb") as wf:
        wf.setnchannels(CHANNELS)
        wf.setsampwidth(2)  # 16-bit
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(audio_data.tobytes())

    # Save transcript
    metadata_path = OUTPUT_DIR / "metadata.jsonl"
    with open(metadata_path, "a", encoding="utf-8") as f:
        f.write(json.dumps({
            "audio": filename,
            "text": sentence,
            "duration": len(audio_data) / SAMPLE_RATE
        }, ensure_ascii=False) + "\n")

    print(f"  Saved: {filename}")
    return filepath


def main():
    print("=" * 60)
    print("  MWESH VOICE RECORDER")
    print("  Record voice samples for TTS training")
    print("=" * 60)
    print()
    print("This will record you reading sentences for voice training.")
    print("Tips:")
    print("  - Find a quiet room")
    print("  - Speak naturally, like you're reciting poetry")
    print("  - Each recording is ~5-10 seconds")
    print("  - You'll record 40 sentences total")
    print("  - Takes about 15-20 minutes")
    print()
    print("When you hear the tone, start speaking.")
    print("Stop talking for 1.5 seconds to auto-stop recording.")
    print()

    if not check_audio():
        return

    # Clear previous recordings
    if OUTPUT_DIR.exists():
        existing = list(OUTPUT_DIR.glob("sample_*.wav"))
        if existing:
            print(f"Found {len(existing)} existing recordings.")
            resp = input("Delete them and start fresh? (y/n): ").strip().lower()
            if resp == "y":
                for f in existing:
                    f.unlink()
                metadata = OUTPUT_DIR / "metadata.jsonl"
                if metadata.exists():
                    metadata.unlink()
                print("Cleared old recordings.")
            else:
                print("Keeping existing recordings.")
                resp = input("Record more sentences? (y/n): ").strip().lower()
                if resp != "y":
                    return

    print()
    print("Ready to record! Press Ctrl+C at any time to stop.")
    print()

    recorded = 0
    try:
        for i, sentence in enumerate(TRAINING_SENTENCES):
            audio = record_sentence(i + 1, sentence)
            if audio is not None:
                save_recording(audio, i + 1, sentence)
                recorded += 1
                print(f"  Progress: {recorded}/{len(TRAINING_SENTENCES)} sentences recorded")
            else:
                resp = input("  Skip this sentence? (y/n): ").strip().lower()
                if resp != "y":
                    # Retry
                    audio = record_sentence(i + 1, sentence)
                    if audio is not None:
                        save_recording(audio, i + 1, sentence)
                        recorded += 1

    except KeyboardInterrupt:
        print(f"\n\nStopped. Recorded {recorded} sentences.")

    print()
    print(f"Recording complete! {recorded} sentences saved to {OUTPUT_DIR}")
    print()
    print("Next steps:")
    print(f"  1. Review recordings in {OUTPUT_DIR}")
    print(f"  2. Delete any bad ones (re-run this script to re-record)")
    print(f"  3. Run: python train-voice.py")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nRecording cancelled.")
