/**
 * Stores recorded narration files in Workers KV (the store behind workers/narration) from this
 * computer, with wrangler's login. Used because uploads from GitHub runners fail.
 *
 * Steps:
 *   gh run download <run-id> -n narration-files -D .narration/reels
 *   npm run narration:upload -- [--max N]
 *     --max  store at most N reels in this run, default 490 (free plan: 1,000 KV writes a day, 2 per reel)
 *
 * Files already in KV are skipped. For each group of reels the MP3s go first, then their timings JSON,
 * because the JSON is what marks a reel as done. At the end it updates content/narration.json (commit it):
 * the app only plays a reel's MP3 once the reel is listed there.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { NARRATION_VOICE, fingerprint } from '../src/features/narration/logic';
import type { NarrationIndex, ReelNarration } from '../src/features/narration/logic';

/** A reel's timings file, as written by scripts/build-reel-narration.ts. */
type Recorded = { file: string; lines: { text: string; start: number; end: number }[] };

const NAMESPACE_ID = 'fea782987620427fb33bde8db9417b01';
const WRANGLER = 'wrangler@4.163.0';
const GROUP = 50;

const root = process.cwd();
const dir = path.join(root, '.narration', 'reels');
const indexFile = path.join(root, 'content', 'narration.json');

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

const wrangler = (args: string[]) =>
  execFileSync('npx', ['-y', WRANGLER, 'kv', ...args, '--namespace-id', NAMESPACE_ID, '--remote'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  });

function storedKeys(): Set<string> {
  const listed: { name: string }[] = JSON.parse(wrangler(['key', 'list']));
  return new Set(listed.map(item => item.name));
}

function put(keys: string[]) {
  const file = path.join(os.tmpdir(), `narration-bulk-${process.pid}.json`);
  const items = keys.map(key => ({
    key,
    value: fs.readFileSync(path.join(dir, key)).toString('base64'),
    base64: true,
  }));
  fs.writeFileSync(file, JSON.stringify(items));
  try {
    wrangler(['bulk', 'put', file]);
  } finally {
    fs.rmSync(file, { force: true });
  }
}

function main() {
  const max = option('max', 490);
  if (!fs.existsSync(dir)) {
    throw new Error('No .narration/reels folder: download the run files first (see the top of this script).');
  }
  // Every recorded reel: <voice>/<reel-id>-<hash>.mp3 with its .json next to it.
  const reels: string[] = [];
  for (const voice of fs.readdirSync(dir, { withFileTypes: true }).filter(d => d.isDirectory())) {
    for (const file of fs.readdirSync(path.join(dir, voice.name)).filter(f => f.endsWith('.mp3'))) {
      const key = `${voice.name}/${file}`;
      if (fs.existsSync(path.join(dir, key.replace(/\.mp3$/, '.json')))) {
        reels.push(key);
      }
    }
  }
  const stored = storedKeys();
  const todo = reels.filter(mp3 => !stored.has(mp3.replace(/\.mp3$/, '.json'))).sort().slice(0, max);
  console.log(`${reels.length} reels on this computer, storing ${todo.length} in KV.`);

  for (let at = 0; at < todo.length; at += GROUP) {
    const group = todo.slice(at, at + GROUP);
    const mp3s = group.filter(key => !stored.has(key));
    if (mp3s.length > 0) {
      put(mp3s);
    }
    put(group.map(key => key.replace(/\.mp3$/, '.json')));
    console.log(`✔ ${Math.min(at + GROUP, todo.length)}/${todo.length} stored`);
  }
  writeIndex(reels, new Set([...stored, ...todo.map(key => key.replace(/\.mp3$/, '.json'))]));
}

/**
 * Adds every stored reel found on this computer to content/narration.json, which tells the app
 * where each line is inside its reel's MP3. Entries already in the file are kept.
 */
function writeIndex(reels: string[], stored: Set<string>) {
  const index: NarrationIndex = fs.existsSync(indexFile)
    ? JSON.parse(fs.readFileSync(indexFile, 'utf8'))
    : { voice: NARRATION_VOICE, reels: {} };
  if (index.voice !== NARRATION_VOICE) {
    index.voice = NARRATION_VOICE;
    index.reels = {};
  }
  let added = 0;
  for (const mp3 of reels) {
    const json = mp3.replace(/\.mp3$/, '.json');
    if (!stored.has(json)) {
      continue;
    }
    const entry: Recorded = JSON.parse(fs.readFileSync(path.join(dir, json), 'utf8'));
    const reelId = path.basename(mp3).replace(/-[0-9a-f]{10}\.mp3$/, '');
    const lines: ReelNarration['lines'] = {};
    for (const line of entry.lines) {
      lines[fingerprint(line.text.trim())] = [line.start, line.end];
    }
    if (index.reels[reelId]?.file !== entry.file) {
      added++;
    }
    index.reels[reelId] = { file: entry.file, lines };
  }
  const sorted = Object.fromEntries(Object.entries(index.reels).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(indexFile, JSON.stringify({ voice: index.voice, reels: sorted }, null, 1) + '\n');
  console.log(`✔ content/narration.json: ${Object.keys(sorted).length} reels (${added} new or changed)`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
