"""
Download poetic recitations from Internet Archive (LibriVox) for TTS training.
- Fetches public-domain MP3s and converts to 22050Hz WAV for Piper (train-voice.py)
- Default: Short Poetry 001 (29 poems, 36MB, diverse voices, ideal for poetic rhythm)
- Usage:
    python download_archive_audio.py --collection short_poetry_001_librivox
    python download_archive_audio.py --url https://archive.org/download/short_poetry_001_librivox/short_poetry_001_librivox_64kb_mp3.zip
    python download_archive_audio.py --list  # show ready-made poetry collections
"""

import argparse
import json
import re
import sys
import zipfile
import tempfile
from pathlib import Path
from urllib.request import urlretrieve, urlopen

ROOT = Path(__file__).parent
OUT_DIR = ROOT / "voice-samples-archive"
CACHE_DIR = ROOT / "voice-cache"

# Curated Internet Archive poetry audio — all Public Domain / CC0, clean reader voices
COLLECTIONS = {
    "short_poetry_001_librivox": {
        "url": "https://archive.org/download/short_poetry_001_librivox/short_poetry_001_librivox_64kb_mp3.zip",
        "desc": "29 poems (Eliot, Dickinson, Frost, Whitman) — 36.5MB MP3, varied pacing",
        "files": 29,
    },
    "short_poetry_251_librivox": {
        "url": "https://archive.org/download/short_poetry_collection_251_librivox/short_poetry_collection_251_64kb_mp3.zip",
        "desc": "Short Poetry 251 — modern LibriVox batch, clean studio",
        "files": 30,
    },
    "raven_poe": {
        "url": "https://archive.org/download/ravenandpoemspoe_pc_librivox/ravenandpoemspoe_pc_librivox_64kb_mp3.zip",
        "desc": "Poe Raven + Annabel Lee — single deep voice, dramatic",
        "files": 15,
    },
    "wallace_stevens": {
        "url": "https://archive.org/download/poems_of_wallace_stevens_volume_1_add_librivox/poems_of_wallace_stevens_volume_1_add_librivox_64kb_mp3.zip",
        "desc": "Wallace Stevens 101 poems — contemplative, slow",
        "files": 50,
    },
    "dickinson_series1": {
        "url": "https://archive.org/download/poems_series1_dickinson_stl_librivox/poems_series1_dickinson_stl_librivox_64kb_mp3.zip",
        "desc": "Emily Dickinson Series One — Nature/Love/Time",
        "files": 30,
    },
}

def list_collections():
    print("Available Internet Archive poetry audio (Public Domain):")
    for k, v in COLLECTIONS.items():
        print(f"  {k:30} {v['desc']} -> {v['url']}")
    print("\nAdd your own: any archive.org/download/.../*.zip works")

def download_and_prepare(url: str, convert_to_wav=True, sample_rate=22050):
    OUT_DIR.mkdir(exist_ok=True)
    fname = url.split("/")[-1]
    tmp_zip = CACHE_DIR / fname
    CACHE_DIR.mkdir(exist_ok=True)

    print(f"[download] {url}")
    print(f"  -> {tmp_zip}")
    if not tmp_zip.exists():
        urlretrieve(url, tmp_zip)
        print(f"  downloaded {tmp_zip.stat().st_size/1024/1024:.1f} MB")
    else:
        print(f"  cached {tmp_zip.stat().st_size/1024/1024:.1f} MB")

    # Extract
    print(f"[extract] to {OUT_DIR}")
    with zipfile.ZipFile(tmp_zip, 'r') as z:
        members = [m for m in z.namelist() if m.lower().endswith((".mp3",".ogg",".m4b",".wav"))]
        print(f"  {len(members)} audio files")
        for m in members:
            z.extract(m, OUT_DIR)
            print(f"    {Path(m).name}")

    # Convert MP3 -> WAV 22050 mono for Piper if ffmpeg exists
    if convert_to_wav:
        try:
            import subprocess, shutil
            if not shutil.which("ffmpeg"):
                print("[convert] ffmpeg not found — keeping MP3. Install ffmpeg for auto WAV 22050 conversion:")
                print("  winget install ffmpeg  OR  choco install ffmpeg")
                return
            for p in OUT_DIR.rglob("*.mp3"):
                wav = p.with_suffix(".wav")
                if wav.exists():
                    continue
                cmd = ["ffmpeg","-y","-i",str(p),"-ac","1","-ar",str(sample_rate),"-acodec","pcm_s16le",str(wav)]
                subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                if wav.exists():
                    print(f"  converted {p.name} -> {wav.name}")
            # Build metadata.jsonl for train-voice.py (needs text; we generate placeholder)
            # For real Piper training you need transcript; Librivox text is in Gutenberg — we link it
            metadata = OUT_DIR / "metadata-archive.jsonl"
            with open(metadata, "w", encoding="utf-8") as out:
                for wav in sorted(OUT_DIR.rglob("*.wav")):
                    # try to find matching .txt transcript on archive.org/details page
                    out.write(json.dumps({"audio": wav.name, "text": wav.stem.replace("_"," "), "source": url}, ensure_ascii=False)+"\n")
            print(f"[metadata] placeholder {metadata} — replace 'text' with actual poem lines from Gutenberg for best training")
        except Exception as e:
            print(f"[convert] skipped: {e}")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--collection", default="short_poetry_001_librivox", help="key from COLLECTIONS or full archive.org zip URL")
    ap.add_argument("--url", help="direct archive.org/download/...zip URL")
    ap.add_argument("--list", action="store_true", help="list known collections")
    ap.add_argument("--no-convert", action="store_true", help="skip ffmpeg WAV conversion")
    args = ap.parse_args()

    if args.list:
        list_collections()
        return

    url = args.url
    if not url:
        if args.collection in COLLECTIONS:
            url = COLLECTIONS[args.collection]["url"]
        elif args.collection.startswith("http"):
            url = args.collection
        else:
            print(f"Unknown collection '{args.collection}' — use --list")
            sys.exit(1)

    download_and_prepare(url, convert_to_wav=not args.no_convert)

if __name__ == "__main__":
    main()
