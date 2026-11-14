"""Records narration lines with Kokoro. Called by scripts/build-narration.ts, not by hand.

Arguments: model file, voices file, voice name, jobs file.
The jobs file is a JSON list of {"text": ..., "file": ...}; each text is saved as an MP3.
"""
import json
import sys

import soundfile
from kokoro_onnx import Kokoro

model, voices, voice, jobs_file = sys.argv[1:5]
kokoro = Kokoro(model, voices)

with open(jobs_file, encoding="utf-8") as f:
    jobs = json.load(f)

for number, job in enumerate(jobs, start=1):
    samples, sample_rate = kokoro.create(job["text"], voice=voice, speed=1.0, lang="en-us")
    soundfile.write(job["file"], samples, sample_rate, format="MP3")
    print(f"  {number}/{len(jobs)} {job['text'][:60]}", flush=True)
