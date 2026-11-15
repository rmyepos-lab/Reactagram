/**
 * Checks every reel before it can be published:
 *  - matches the schema (narration present, quiz answer in range, highlight lines exist)
 *  - file name equals reel id, ids are unique
 *  - no near-duplicate titles/questions (cheap word-overlap check)
 *  - content/curriculum.json is valid; every reel points at a real topic + concept;
 *    one learn reel per concept, at most 3 quiz reels per concept
 * Run: npm run validate
 */
import fs from "node:fs";
import path from "node:path";
import { curriculumSchema, learnReelSchema, quizReelSchema } from "../src/features/content/schema";

const MAX_QUIZZES_PER_CONCEPT = 3;
const root = path.join(process.cwd(), "content", "reels");
const errors: string[] = [];

// concept id -> topic name
const conceptTopic = new Map<string, string>();
const curriculum = curriculumSchema.safeParse(
  JSON.parse(fs.readFileSync(path.join(process.cwd(), "content", "curriculum.json"), "utf8")),
);
if (!curriculum.success) {
  for (const issue of curriculum.error.issues) errors.push(`curriculum.json: ${issue.path.join(".")} ${issue.message}`);
} else {
  for (const t of curriculum.data.topics) {
    for (const c of t.concepts) {
      if (conceptTopic.has(c.id)) errors.push(`curriculum.json: duplicate concept "${c.id}"`);
      conceptTopic.set(c.id, t.name);
    }
  }
  for (const t of curriculum.data.topics) {
    for (const c of t.concepts) {
      for (const r of c.requires ?? []) {
        if (!conceptTopic.has(r)) errors.push(`curriculum.json: "${c.id}" requires unknown concept "${r}"`);
        if (r === c.id) errors.push(`curriculum.json: "${c.id}" requires itself`);
      }
    }
  }
}
// concept id -> reel ids, per kind
const perConcept = { learn: new Map<string, string[]>(), quiz: new Map<string, string[]>() };
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

    const topic = conceptTopic.get(reel.concept);
    if (curriculum.success && !topic) errors.push(`${where}: unknown concept "${reel.concept}" (add it to curriculum.json)`);
    else if (topic && topic !== reel.topic) errors.push(`${where}: topic must be "${topic}" for concept "${reel.concept}"`);
    const siblings = perConcept[kind].get(reel.concept) ?? [];
    perConcept[kind].set(reel.concept, [...siblings, reel.id]);

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

for (const [concept, list] of perConcept.learn) {
  if (list.length > 1) errors.push(`concept "${concept}" has ${list.length} learn reels (${list.join(", ")}); split the concept or merge the reels`);
}
for (const [concept, list] of perConcept.quiz) {
  if (list.length > MAX_QUIZZES_PER_CONCEPT) {
    errors.push(`concept "${concept}" has ${list.length} quiz reels; max ${MAX_QUIZZES_PER_CONCEPT}`);
  }
}

if (errors.length) {
  console.error(`✖ ${errors.length} problem(s):\n` + errors.map((e) => "  - " + e).join("\n"));
  process.exit(1);
}
console.log(`✔ ${ids.size} reels valid, ${perConcept.learn.size}/${conceptTopic.size} concepts have a learn reel`);
