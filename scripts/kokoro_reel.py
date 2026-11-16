"""Records one MP3 per reel with Kokoro. Called by scripts/build-reel-narration.ts, not by hand.

Arguments: model file, voices file, voice name, jobs file, timings file.
The jobs file is a JSON list of {"id": ..., "file": ..., "texts": [...]}. Each reel's lines are
recorded in order, joined with a short silence, and saved as one MP3. The timings file gets
{id: [[start_ms, end_ms], ...]}, one pair per line, so the app knows where each line starts.
"""
import json
import sys

import numpy
import soundfile
from kokoro_onnx import Kokoro

GAP_SECONDS = 0.35

model, voices, voice, jobs_file, timings_file = sys.argv[1:6]
kokoro = Kokoro(model, voices)

with open(jobs_file, encoding="utf-8") as f:
    jobs = json.load(f)

timings = {}
for number, job in enumerate(jobs, start=1):
    parts = []
    spans = []
    position = 0
    sample_rate = 24000
    for index, text in enumerate(job["texts"]):
        samples, sample_rate = kokoro.create(text, voice=voice, speed=1.0, lang="en-us")
        if index > 0:
            gap = numpy.zeros(int(GAP_SECONDS * sample_rate), dtype=samples.dtype)
            parts.append(gap)
            position += len(gap)
        spans.append([round(position * 1000 / sample_rate), round((position + len(samples)) * 1000 / sample_rate)])
        parts.append(samples)
        position += len(samples)
    # Constant 32 kbps (level 0.85 at Kokoro's 24 kHz), to keep downloads and the phone cache small.
    soundfile.write(
        job["file"], numpy.concatenate(parts), sample_rate,
        format="MP3", bitrate_mode="CONSTANT", compression_level=0.85,
    )
    timings[job["id"]] = spans
    print(f"  {number}/{len(jobs)} {job['id']} ({len(job['texts'])} lines, {position / sample_rate:.1f}s)", flush=True)

with open(timings_file, "w", encoding="utf-8") as f:
    json.dump(timings, f)
