/**
 * Records the voice for every narration line (the `say` texts) with Kokoro, a free
 * text-to-speech model that runs on this computer. One MP3 per line, named after the text,
 * so a line that didn't change is never recorded twice.
 *
 * Run: npm run narration
 *
 * The first run installs Kokoro into .narration/ (Python 3.10+ needed, about 700 MB).
 * Files land in .narration/out/<voice>/. To also upload them to the Supabase bucket, set
 * SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the shell first. That key is a secret:
 * never write it in a file of this repo.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { NARRATION_BUCKET, NARRATION_VOICE, narrationPath } from '../src/features/narration/logic';

const KOKORO_VERSION = '0.6.1';
const SOUNDFILE_VERSION = '0.14.0';
const MODEL_FILES = 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0';

const root = process.cwd();
const work = path.join(root, '.narration');
const out = path.join(work, 'out');
const python = path.join(work, 'venv', 'bin', 'python');
const model = path.join(work, 'kokoro-v1.0.onnx');
const voices = path.join(work, 'voices-v1.0.bin');

const run = (cmd: string, args: string[]) => execFileSync(cmd, args, { stdio: 'inherit' });

/** Every narration line in the content folder, without repeats. */
function lines(): string[] {
  const found = new Set<string>();
  const add = (value: unknown) => {
    if (typeof value === 'string' && value.trim()) {
      found.add(value.trim());
    }
  };
  for (const kind of ['learn', 'quiz']) {
    const dir = path.join(root, 'content', 'reels', kind);
    for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
      const reel = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
      add(reel.say);
      add(reel.explainSay);
      for (const slide of reel.slides ?? []) {
        add(slide.say);
        for (const step of slide.steps ?? []) {
          add(step.say);
        }
      }
    }
  }
  return [...found];
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

async function upload(files: string[]) {
  // Only the site part is kept, so a pasted ".../rest/v1/" still works.
  const given = (process.env.SUPABASE_URL ?? '').trim();
  const url = URL.canParse(given) ? new URL(given).origin : '';
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();
  if (!url || !key) {
    console.log(
      `Not uploaded (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are not set). ` +
        `Upload the folder .narration/out/${NARRATION_VOICE} into the "${NARRATION_BUCKET}" bucket by hand, keeping the folder name.`,
    );
    return;
  }
  if (key.startsWith('sb_publishable_')) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY holds the publishable key, which may not upload. Use the secret key (sb_secret_…).',
    );
  }
  let sent = 0;
  for (const file of files) {
    const address = `${url}/storage/v1/object/${NARRATION_BUCKET}/${file}`;
    // Files already on the server are skipped: a file's name is tied to its text.
    const exists = await fetch(`${url}/storage/v1/object/public/${NARRATION_BUCKET}/${file}`, { method: 'HEAD' });
    if (exists.ok) {
      continue;
    }
    const res = await fetch(address, {
      method: 'POST',
      headers: {
        // Both headers carry the same key, the way Supabase's own client sends it.
        Authorization: `Bearer ${key}`,
        apikey: key,
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'max-age=31536000',
      },
      body: new Uint8Array(fs.readFileSync(path.join(out, file))),
    });
    if (!res.ok) {
      throw new Error(`Upload failed for ${file}: ${res.status} ${await res.text()}`);
    }
    sent++;
  }
  console.log(`✔ uploaded ${sent} new file(s), ${files.length - sent} already on the server`);
}

async function main() {
  const all = lines().map(text => ({ text, file: narrationPath(text) }));
  const missing = all.filter(job => !fs.existsSync(path.join(out, job.file)));
  console.log(`${all.length} narration lines, ${missing.length} to record.`);

  if (missing.length > 0) {
    fs.mkdirSync(path.join(out, NARRATION_VOICE), { recursive: true });
    installKokoro();
    const jobs = path.join(work, 'jobs.json');
    fs.writeFileSync(
      jobs,
      JSON.stringify(missing.map(job => ({ text: job.text, file: path.join(out, job.file) }))),
    );
    run(python, [path.join(root, 'scripts', 'kokoro_tts.py'), model, voices, NARRATION_VOICE, jobs]);
    console.log(`✔ recorded ${missing.length} line(s) into .narration/out/${NARRATION_VOICE}`);
  }

  await upload(all.map(job => job.file));
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
