/**
 * Records one MP3 per reel (all its narration lines in order, with a short pause between
 * them) and a timings file saying where each line starts and ends.
 *
 * Run: npm run narration:reels -- [--max N]
 *   --max  record at most N reels in this run, default 300
 *
 * Uses the same Kokoro install as `npm run narration` (installed into .narration/ on first run).
 * Output: .narration/reels/<voice>/<reel-id>-<hash>.mp3 (+ .json with its timings) and
 * .narration/reels/narration-timings.json for every reel.
 * The hash changes when a reel's text changes, so an unchanged reel is never recorded twice.
 *
 * Storage: the narration Worker (workers/narration) on Cloudflare. A reel whose timings JSON is
 * already there is skipped. With NARRATION_UPLOAD_TOKEN set (a secret: shell or GitHub only),
 * new files are uploaded after every batch, so a stopped run keeps what it recorded.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { NARRATION_VOICE } from '../src/features/narration/logic';

const KOKORO_VERSION = '0.6.1';
const SOUNDFILE_VERSION = '0.14.0';
const MODEL_FILES = 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0';

const root = process.cwd();
const work = path.join(root, '.narration');
const out = path.join(work, 'reels');
const python = path.join(work, 'venv', 'bin', 'python');
const model = path.join(work, 'kokoro-v1.0.onnx');
const voices = path.join(work, 'voices-v1.0.bin');
const timingsFile = path.join(out, 'narration-timings.json');
const STORE = 'https://hookd-narration.narration.workers.dev';
const BATCH = 25;

type Line = { text: string; start: number; end: number };
type Entry = { file: string; lines: Line[] };
type Timings = { voice: string; reels: Record<string, Entry> };
type Reel = { id: string; texts: string[]; file: string };

const run = (cmd: string, args: string[]) => execFileSync(cmd, args, { stdio: 'inherit' });

function option(name: string, fallback: number): number {
  const at = process.argv.indexOf(`--${name}`);
  if (at < 0) {
    return fallback;
  }
  const value = Number(process.argv[at + 1]);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`--${name} needs a whole number`);
  }
  return value;
}

/** Every reel with its narration lines, in the order the app speaks them. */
function reels(): { id: string; texts: string[] }[] {
  const found: { id: string; texts: string[] }[] = [];
  for (const kind of ['learn', 'quiz']) {
    const dir = path.join(root, 'content', 'reels', kind);
    for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
      const reel = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
      const texts: string[] = [];
      const add = (value: unknown) => {
        if (typeof value === 'string' && value.trim()) {
          texts.push(value.trim());
        }
      };
      add(reel.say);
      for (const slide of reel.slides ?? []) {
        add(slide.say);
        for (const step of slide.steps ?? []) {
          add(step.say);
        }
      }
      add(reel.explainSay);
      if (texts.length > 0) {
        found.push({ id: String(reel.id ?? path.basename(file, '.json')), texts });
      }
    }
  }
  return found.sort((a, b) => a.id.localeCompare(b.id));
}

function fileFor(reel: { id: string; texts: string[] }): string {
  const hash = createHash('sha1').update(NARRATION_VOICE).update(JSON.stringify(reel.texts)).digest('hex');
  return `${NARRATION_VOICE}/${reel.id}-${hash.slice(0, 10)}.mp3`;
}

function installKokoro() {
  if (!fs.existsSync(python)) {
    console.log('Installing Kokoro (first run only)…');
    run('python3', ['-m', 'venv', path.join(work, 'venv')]);
    run(python, [
      '-m', 'pip', 'install', '--quiet',
      `kokoro-onnx==${KOKORO_VERSION}`,
      `soundfile==${SOUNDFILE_VERSION}`,
    ]);
  }
  for (const file of [model, voices]) {
    if (!fs.existsSync(file)) {
      console.log(`Downloading ${path.basename(file)}…`);
      run('curl', ['-L', '--fail', '--progress-bar', '-o', file, `${MODEL_FILES}/${path.basename(file)}`]);
    }
  }
}

const timingsPath = (file: string) => file.replace(/\.mp3$/, '.json');

/** The reel's timings, from this computer or from the store; null when it isn't recorded yet. */
async function stored(reel: Reel): Promise<Entry | null> {
  const local = path.join(out, timingsPath(reel.file));
  if (fs.existsSync(local) && fs.existsSync(path.join(out, reel.file))) {
    return JSON.parse(fs.readFileSync(local, 'utf8'));
  }
  const res = await fetch(`${STORE}/${timingsPath(reel.file)}`);
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`Store check failed for ${reel.id}: ${res.status}`);
  }
  return (await res.json()) as Entry;
}

async function send(file: string, token: string) {
  const res = await fetch(`${STORE}/${file}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: new Uint8Array(fs.readFileSync(path.join(out, file))),
  });
  // 409: already stored by an earlier run, which is fine.
  if (!res.ok && res.status !== 409) {
    throw new Error(`Upload failed for ${file}: ${res.status} ${await res.text()}`);
  }
}

async function main() {
  const max = option('max', 300);
  const token = (process.env.NARRATION_UPLOAD_TOKEN ?? '').trim();
  const all: Reel[] = reels().map(reel => ({ ...reel, file: fileFor(reel) }));
  const timings: Timings = { voice: NARRATION_VOICE, reels: {} };

  const missing: Reel[] = [];
  for (const reel of all) {
    const entry = await stored(reel);
    if (entry) {
      timings.reels[reel.id] = entry;
    } else {
      missing.push(reel);
    }
  }
  const todo = missing.slice(0, max);
  console.log(
    `${all.length} reels, ${all.length - missing.length} already recorded, ${missing.length} missing; ` +
      `recording ${todo.length} in this run.`,
  );
  if (!token) {
    console.log('Not uploading: NARRATION_UPLOAD_TOKEN is not set. Files stay in .narration/reels.');
  }

  if (todo.length > 0) {
    fs.mkdirSync(path.join(out, NARRATION_VOICE), { recursive: true });
    installKokoro();
  }
  for (let at = 0; at < todo.length; at += BATCH) {
    const batch = todo.slice(at, at + BATCH);
    const jobs = path.join(work, 'reel-jobs.json');
    const spansFile = path.join(work, 'reel-spans.json');
    fs.writeFileSync(
      jobs,
      JSON.stringify(batch.map(reel => ({ id: reel.id, file: path.join(out, reel.file), texts: reel.texts }))),
    );
    run(python, [path.join(root, 'scripts', 'kokoro_reel.py'), model, voices, NARRATION_VOICE, jobs, spansFile]);
    const spans: Record<string, [number, number][]> = JSON.parse(fs.readFileSync(spansFile, 'utf8'));
    for (const reel of batch) {
      const entry: Entry = {
        file: reel.file,
        lines: reel.texts.map((text, i) => ({ text, start: spans[reel.id][i][0], end: spans[reel.id][i][1] })),
      };
      fs.writeFileSync(path.join(out, timingsPath(reel.file)), JSON.stringify(entry));
      timings.reels[reel.id] = entry;
      if (token) {
        // MP3 first: the JSON is what marks a reel as done.
        await send(reel.file, token);
        await send(timingsPath(reel.file), token);
      }
    }
    console.log(`✔ ${Math.min(at + BATCH, todo.length)}/${todo.length} recorded${token ? ' and uploaded' : ''}`);
  }

  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(timingsFile, JSON.stringify(timings, null, 2) + '\n');
  console.log(
    `✔ timings for ${Object.keys(timings.reels).length} of ${all.length} reel(s) in .narration/reels/narration-timings.json`,
  );
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
