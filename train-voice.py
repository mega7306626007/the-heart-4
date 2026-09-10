"""
Mwesh Voice Trainer
===================
Train a Piper voice model from recorded samples.

Usage:
  python train-voice.py

This script:
1. Reads recorded samples from voice-samples/
2. Prepares the dataset for Piper training
3. Trains a custom voice model
4. Saves the model to voices/

Requirements:
  pip install piper-train torch torchaudio

Note: Training takes 1-3 hours depending on your hardware.
      A GPU is strongly recommended but not required.
"""

import os
import sys
import json
import shutil
import subprocess
from pathlib import Path

# Config
SAMPLES_DIR = Path(__file__).parent / "voice-samples"
VOICES_DIR = Path(__file__).parent / "voices"
DATASET_DIR = Path(__file__).parent / "voice-dataset"
OUTPUT_DIR = Path(__file__).parent / "voice-output"

# Training config
VOICE_ID = "mwesh"  # Name for your voice
LANGUAGE = "en"     # Language code
EPOCHS = 500        # More epochs = better quality (but slower)
BATCH_SIZE = 16     # Reduce if you run out of GPU memory
LEARNING_RATE = 0.0001
HIDDEN_SIZE = 256
NUM_LAYERS = 6
NUM_SPESKER_EMBEDS = 0  # Single speaker


def check_training_prereqs():
    """Check if training dependencies are installed."""
    print("Checking dependencies...")

    # Check for PyTorch
    try:
        import torch
        print(f"  PyTorch: {torch.__version__}")
        if torch.cuda.is_available():
            print(f"  GPU: {torch.cuda.get_device_name(0)}")
        else:
            print("  GPU: None (training will be slow)")
    except ImportError:
        print("ERROR: PyTorch not installed.")
        print("  Run: pip install torch torchaudio")
        return False

    # Check for piper-train
    try:
        import piper
        print(f"  Piper: available")
    except ImportError:
        print("ERROR: piper-train not installed.")
        print("  Run: pip install piper-train")
        return False

    return True


def load_dataset():
    """Load recorded samples and prepare dataset."""
    metadata_path = SAMPLES_DIR / "metadata.jsonl"
    if not metadata_path.exists():
        print(f"ERROR: No recordings found at {metadata_path}")
        print("  Run record-voice.py first to record your voice.")
        return None

    samples = []
    with open(metadata_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                samples.append(json.loads(line))

    print(f"Found {len(samples)} recorded samples.")

    # Filter out missing files
    valid_samples = []
    for s in samples:
        audio_path = SAMPLES_DIR / s["audio"]
        if audio_path.exists():
            valid_samples.append(s)
        else:
            print(f"  Warning: Missing {s['audio']}, skipping.")

    print(f"Valid samples: {len(valid_samples)}")

    if len(valid_samples) < 10:
        print("ERROR: Need at least 10 samples for training.")
        print("  Run record-voice.py to record more.")
        return None

    return valid_samples


def prepare_dataset(samples):
    """Prepare dataset directory structure for Piper training."""
    print(f"\nPreparing dataset in {DATASET_DIR}...")

    # Create directories
    DATASET_DIR.mkdir(exist_ok=True)
    audio_dir = DATASET_DIR / "audio"
    audio_dir.mkdir(exist_ok=True)

    # Copy audio files and create transcript file
    transcript_lines = []
    for s in samples:
        src = SAMPLES_DIR / s["audio"]
        dst = audio_dir / s["audio"]
        shutil.copy2(src, dst)

        # Piper format: filename|speaker_id|transcript
        # For single speaker, speaker_id is 0
        transcript_lines.append(f"{s['audio']}|{s['text']}")

    # Write transcripts
    transcript_path = DATASET_DIR / "transcripts.txt"
    with open(transcript_path, "w", encoding="utf-8") as f:
        f.write("\n".join(transcript_lines))

    print(f"  Copied {len(samples)} audio files")
    print(f"  Created transcripts.txt")

    return transcript_path


def train_voice(transcript_path):
    """Run Piper training."""
    print(f"\nStarting voice training...")
    print(f"  Voice ID: {VOICE_ID}")
    print(f"  Epochs: {EPOCHS}")
    print(f"  This will take 1-3 hours depending on your hardware.")
    print()

    # Create output directory
    OUTPUT_DIR.mkdir(exist_ok=True)

    # Build training command
    # Piper training uses a JSON config
    config = {
        "dataset": {
            "transcriptions": str(transcript_path),
            "audio_dir": str(DATASET_DIR / "audio"),
        },
        "model": {
            "hidden_size": HIDDEN_SIZE,
            "num_layers": NUM_LAYERS,
            "num_speakers": NUM_SPESKER_EMBEDS,
        },
        "training": {
            "output_dir": str(OUTPUT_DIR),
            "epochs": EPOCHS,
            "batch_size": BATCH_SIZE,
            "learning_rate": LEARNING_RATE,
        },
        "voice": {
            "id": VOICE_ID,
            "language": LANGUAGE,
        }
    }

    config_path = OUTPUT_DIR / "train_config.json"
    with open(config_path, "w") as f:
        json.dump(config, f, indent=2)

    print(f"  Training config saved to: {config_path}")
    print()
    print("  Training in progress... (press Ctrl+C to stop)")
    print()

    try:
        # Run Piper training
        cmd = [
            sys.executable, "-m", "piper.train",
            "--config", str(config_path),
        ]

        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
        )

        # Print output in real-time
        for line in process.stdout:
            print(f"  {line.rstrip()}")

        process.wait()

        if process.returncode != 0:
            print(f"\nTraining failed with return code {process.returncode}")
            return False

    except KeyboardInterrupt:
        print("\n\nTraining stopped by user.")
        print(f"  Partial model saved to: {OUTPUT_DIR}")
        return False

    return True


def package_model():
    """Package trained model into a usable format."""
    print(f"\nPackaging model...")

    # Find the best checkpoint
    checkpoints = list(OUTPUT_DIR.glob("*.onnx"))
    if not checkpoints:
        # Try to find in epoch directories
        checkpoints = list(OUTPUT_DIR.rglob("best*.onnx"))

    if not checkpoints:
        print("  Warning: No .onnx model found. Training may not have completed.")
        print(f"  Check {OUTPUT_DIR} for training outputs.")
        return False

    # Copy to voices directory
    VOICES_DIR.mkdir(exist_ok=True)

    model_path = checkpoints[0]
    output_model = VOICES_DIR / f"{VOICE_ID}.onnx"
    shutil.copy2(model_path, output_model)

    # Copy config if it exists
    config_path = model_path.with_suffix(".onnx.json")
    if config_path.exists():
        output_config = VOICES_DIR / f"{VOICE_ID}.onnx.json"
        shutil.copy2(config_path, output_config)

    print(f"  Model saved to: {output_model}")
    print()
    print("Voice training complete!")
    print()
    print("Next steps:")
    print(f"  1. Test the voice: python tts-server.py")
    print(f"  2. Open the website and click 'Listen' on a poem")
    print(f"  3. Adjust speed/pitch as needed")

    return True


def main():
    print("=" * 60)
    print("  MWESH VOICE TRAINER")
    print("  Train a custom voice for poem recitation")
    print("=" * 60)
    print()

    # Check prerequisites
    if not check_training_prereqs():
        return

    # Load dataset
    samples = load_dataset()
    if samples is None:
        return

    # Prepare dataset
    transcript_path = prepare_dataset(samples)

    # Confirm before training
    print()
    print(f"Ready to train with {len(samples)} samples.")
    print(f"This will take 1-3 hours.")
    print()
    resp = input("Start training? (y/n): ").strip().lower()
    if resp != "y":
        print("Training cancelled.")
        return

    # Train
    success = train_voice(transcript_path)

    if success:
        # Package model
        package_model()
    else:
        print()
        print("Training incomplete. You can:")
        print(f"  1. Check outputs in: {OUTPUT_DIR}")
        print(f"  2. Resume training later")
        print(f"  3. Record more samples and try again")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nTraining cancelled.")
