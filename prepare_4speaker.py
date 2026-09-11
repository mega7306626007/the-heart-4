"""
Prepare 4-speaker (2M/2F) dataset from voice-samples-archive for Piper.
- Curates balanced ~20 files per speaker from archive pulls (6h raw)
- Mapping: M0=Stevens/Alan Davis Drake, M1=Poe+Peter Yearsley, F0=Annie Coleman+Kara, F1=Betsie Bush + Dickinson female
- Outputs voice-samples-4spk/ with wav + metadata.jsonl (audio|speaker_id|text) for train-voice.py multi-speaker
"""
import shutil, random, json
from pathlib import Path

SRC = Path(r"C:\Users\Emmanuel\Desktop\the heart 4\voice-samples-archive")
OUT = Path(r"C:\Users\Emmanuel\Desktop\the heart 4\voice-samples-4spk")
OUT.mkdir(exist_ok=True)
for p in OUT.glob("*"):
    if p.is_file(): p.unlink()
    elif p.is_dir(): shutil.rmtree(p)

# Mapping by filename patterns -> speaker id
# Verify genders: Alan Drake (M), Peter Yearsley (M), Poe Phil Chenevert (M), Annie Coleman (F), Betsie Bush (F)
SPEAKERS = {
    0: {"name": "Alan_M_Stevens", "patterns": ["stevens"], "gender": "M"},
    1: {"name": "Peter_M_Mixed", "patterns": ["poe", "py_", "whitman", "hopkins", "hemans", "longfellow", "wordsworth", "graves", "owen", "lamb", "browning", "coleridge", "sandburg", "peacock", "eliot", "rumi", "rossetti", "frost", "stevenson", "millay"], "gender": "M"},
    2: {"name": "Annie_F", "patterns": ["_ac_", "dickinson_64kb", "poems_series1"], "gender": "F"},
    3: {"name": "Betsie_F", "patterns": ["_blb_", "_ce_", "_ks_", "doolittle", "selina"], "gender": "F"},
}

# Collect candidates
candidates = {i: [] for i in SPEAKERS}
all_wavs = list(SRC.glob("*.wav"))
for wav in all_wavs:
    name = wav.name.lower()
    assigned = None
    for sid, info in SPEAKERS.items():
        if any(pat.lower() in name for pat in info["patterns"]):
            assigned = sid
            break
    if assigned is None:
        # fallback to M1
        assigned = 1
    candidates[assigned].append(wav)

# Balance: take min(20, len) per speaker, oversample females by duplicating if needed
TARGET_PER = 20
# If female < TARGET, we will fetch more or duplicate with pitch shift note
for sid in sorted(candidates):
    print(f"Speaker {sid} {SPEAKERS[sid]['name']} ({SPEAKERS[sid]['gender']}): {len(candidates[sid])} files")
    # Sample
    files = candidates[sid]
    if len(files) >= TARGET_PER:
        chosen = random.sample(files, TARGET_PER)
    else:
        # Need more - duplicate with warning, will fetch extra later if needed
        chosen = files + random.choices(files, k=TARGET_PER - len(files))
        print(f"  -> oversampled to {TARGET_PER} (need more female archive pulls)")
    for wav in chosen:
        # Copy with speaker prefix to avoid collisions
        dest = OUT / f"spk{sid}_{wav.name}"
        shutil.copy2(wav, dest)

# Write metadata.jsonl for train-voice.py: need audio, text, speaker_id
# For Piper multi-speaker, train-voice.py expects transcripts.txt as "filename|speaker_id|transcript"
# We'll write metadata with speaker_id
meta = OUT / "metadata.jsonl"
with open(meta, "w", encoding="utf-8") as f:
    for p in sorted(OUT.glob("*.wav")):
        sid = int(p.name.split("_")[0].replace("spk",""))
        # Use gutter text from filename as placeholder transcript; user can replace with real poem lines
        text = p.stem.replace(f"spk{sid}_","").replace("_"," ").replace(" 64kb","").replace("-"," ")
        f.write(json.dumps({"audio": p.name, "text": text, "speaker": sid}, ensure_ascii=False)+"\n")

print(f"\nPrepared {len(list(OUT.glob('*.wav')))} WAVs in {OUT}")
print(f"Metadata: {meta} ({len(open(meta).readlines())} entries)")
# Also write transcripts.txt in Piper format for immediate train-voice.py use
trans = OUT / "transcripts.txt"
with open(trans, "w", encoding="utf-8") as f:
    for line in open(meta, encoding="utf-8"):
        j=json.loads(line)
        f.write(f"{j['audio']}|{j['speaker']}|{j['text']}\n")
print(f"Transcripts: {trans}")
print("\nNext: set train-voice.py NUM_SPESKER_EMBEDS=4 and run python train-voice.py with --dataset", OUT)
