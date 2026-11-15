/**
 * Shows which curriculum concepts still need reels. Used by /new-reels to pick work.
 *
 *   npm run coverage                       one line per topic + the next gaps to fill
 *   npm run coverage -- --topic "Refs"     every concept of one topic, with its existing reels
 *
 * A concept is "done" when it has 1 learn reel and at least 2 quiz reels.
 * Gaps whose `requires` are already covered are listed first.
 */
import fs from 'node:fs';
import path from 'node:path';
import { curriculumSchema, type LearnReel, type QuizReel } from '../src/features/content/schema';

const MIN_QUIZZES = 2;
const GAP_LIMIT = 40;

const cwd = process.cwd();
const curriculum = curriculumSchema.parse(
  JSON.parse(fs.readFileSync(path.join(cwd, 'content', 'curriculum.json'), 'utf8')),
);
const read = <T>(kind: string): T[] =>
  fs
    .readdirSync(path.join(cwd, 'content', 'reels', kind))
    .filter(f => f.endsWith('.json'))
    .map(f => JSON.parse(fs.readFileSync(path.join(cwd, 'content', 'reels', kind, f), 'utf8')) as T);

const learn = read<LearnReel>('learn');
const quiz = read<QuizReel>('quiz');
const learnOf = (c: string) => learn.filter(r => r.concept === c);
const quizOf = (c: string) => quiz.filter(r => r.concept === c);
const hasLearn = (c: string) => learnOf(c).length > 0;
const done = (c: string) => hasLearn(c) && quizOf(c).length >= MIN_QUIZZES;

const topicArg = process.argv.indexOf('--topic');
const onlyTopic = topicArg > -1 ? process.argv[topicArg + 1] : undefined;

if (onlyTopic) {
  const topic = curriculum.topics.find(t => t.name.toLowerCase() === onlyTopic.toLowerCase());
  if (!topic) {
    console.error(`No topic "${onlyTopic}". Topics: ${curriculum.topics.map(t => t.name).join(', ')}`);
    process.exit(1);
  }
  console.log(`${topic.name} (${topic.track})`);
  for (const c of topic.concepts) {
    console.log(`\n[${done(c.id) ? 'x' : ' '}] ${c.id} · ${c.level} · ${c.title}\n    ${c.source}`);
    for (const r of learnOf(c.id)) console.log(`    learn ${r.id}: ${r.title}`);
    for (const r of quizOf(c.id)) console.log(`    quiz  ${r.id} (${r.format}): ${r.question}`);
  }
  process.exit(0);
}

let total = 0;
let covered = 0;
for (const t of curriculum.topics) {
  const n = t.concepts.filter(c => done(c.id)).length;
  total += t.concepts.length;
  covered += n;
  console.log(`${String(n).padStart(3)}/${String(t.concepts.length).padEnd(3)} ${t.name}`);
}
console.log(`${String(covered).padStart(3)}/${total} concepts done (1 learn + ${MIN_QUIZZES} quiz)\n`);

const gaps = curriculum.topics.flatMap(t =>
  t.concepts
    .filter(c => !done(c.id))
    .map(c => ({
      ...c,
      topic: t.name,
      ready: (c.requires ?? []).every(hasLearn),
      need: `${hasLearn(c.id) ? '' : 'learn + '}${Math.max(0, MIN_QUIZZES - quizOf(c.id).length)} quiz`,
    })),
);
gaps.sort((a, b) => Number(b.ready) - Number(a.ready));
console.log(`Next gaps (${gaps.length} total, prerequisites covered first):`);
for (const g of gaps.slice(0, GAP_LIMIT)) {
  console.log(`- ${g.id} [${g.topic} · ${g.level}] needs ${g.need}${g.ready ? '' : ' (prereqs missing)'}`);
}
