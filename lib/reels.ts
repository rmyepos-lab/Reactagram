import "server-only";
import fs from "node:fs";
import path from "node:path";
import { learnReelSchema, quizReelSchema, type LearnReel, type QuizReel } from "./schema";

const ROOT = path.join(process.cwd(), "content", "reels");

function readDir<T>(dir: string, parse: (v: unknown) => T): T[] {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => parse(JSON.parse(fs.readFileSync(path.join(full, f), "utf8"))));
}

const LEVEL = { beginner: 0, intermediate: 1, advanced: 2 } as const;
/** Curriculum order: beginner → advanced, then by the topic order below, then by file name. */
const TOPIC_ORDER = ["Hooks", "State", "useState", "useRef", "useEffect", "Custom Hooks", "Performance"];
const topicRank = (t: string) => (TOPIC_ORDER.indexOf(t) + 1 || 99);
const byCurriculum = <T extends { level: keyof typeof LEVEL; topic: string }>(a: T, b: T) =>
  LEVEL[a.level] - LEVEL[b.level] || topicRank(a.topic) - topicRank(b.topic);

export function getLearnReels(): LearnReel[] {
  return readDir("learn", (v) => learnReelSchema.parse(v)).sort(byCurriculum);
}

export function getQuizReels(): QuizReel[] {
  return readDir("quiz", (v) => quizReelSchema.parse(v)).sort(byCurriculum);
}

export function getTopics(): { topic: string; learn: number; quiz: number }[] {
  const map = new Map<string, { learn: number; quiz: number }>();
  for (const r of getLearnReels()) {
    const t = map.get(r.topic) ?? { learn: 0, quiz: 0 };
    t.learn++;
    map.set(r.topic, t);
  }
  for (const r of getQuizReels()) {
    const t = map.get(r.topic) ?? { learn: 0, quiz: 0 };
    t.quiz++;
    map.set(r.topic, t);
  }
  return [...map.entries()].map(([topic, c]) => ({ topic, ...c }));
}
