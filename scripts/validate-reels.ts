/**
 * Checks every reel before it can be published:
 *  - matches the schema (narration present, quiz answer in range, highlight lines exist)
 *  - file name equals reel id, ids are unique
 *  - no near-duplicate titles/questions (cheap word-overlap check)
 * Run: npm run validate
 */
import fs from "node:fs";
import path from "node:path";
import { learnReelSchema, quizReelSchema } from "../lib/schema";

const root = path.join(process.cwd(), "content", "reels");
const errors: string[] = [];
const ids = new Set<string>();
const fingerprints: { id: string; kind: string; words: Set<string>; code: string }[] = [];

const words = (s: string) =>
  new Set(s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2));

function similarity(a: Set<string>, b: Set<string>) {
  const inter = [...a].filter((w) => b.has(w)).length;
  return inter / Math.max(1, Math.min(a.size, b.size));
}

for (const kind of ["learn", "quiz"] as const) {
  const dir = path.join(root, kind);
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const where = `${kind}/${file}`;
    let data: unknown;
    try {
      data = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
    } catch (e) {
      errors.push(`${where}: invalid JSON (${(e as Error).message})`);
      continue;
    }
    const res = (kind === "learn" ? learnReelSchema : quizReelSchema).safeParse(data);
    if (!res.success) {
      for (const issue of res.error.issues) errors.push(`${where}: ${issue.path.join(".")} ${issue.message}`);
      continue;
    }
    const reel = res.data;
    if (`${reel.id}.json` !== file) errors.push(`${where}: id "${reel.id}" must match file name`);
    if (ids.has(reel.id)) errors.push(`${where}: duplicate id "${reel.id}"`);
    ids.add(reel.id);

    // Same wording AND same code = duplicate. Same question with different code is a valid variation.
    const text = reel.kind === "learn" ? reel.title : `${reel.question} ${reel.options.join(" ")}`;
    const code = (reel.kind === "learn" ? reel.slides.map((s) => s.code ?? "").join("") : reel.code ?? "").replace(/\s+/g, "");
    const fp = words(text);
    for (const other of fingerprints) {
      if (other.kind === kind && other.code === code && similarity(fp, other.words) >= 0.9) {
        errors.push(`${where}: looks like a duplicate of "${other.id}"`);
      }
    }
    fingerprints.push({ id: reel.id, kind, words: fp, code });
  }
}

if (errors.length) {
  console.error(`✖ ${errors.length} problem(s):\n` + errors.map((e) => "  - " + e).join("\n"));
  process.exit(1);
}
console.log(`✔ ${ids.size} reels valid`);
