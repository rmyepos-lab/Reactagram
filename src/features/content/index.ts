import { learnJson, quizJson } from './reels.generated';
import type { Curriculum, LearnReel, QuizReel } from './schema';
import curriculumJson from '../../../content/curriculum.json';

export type { LearnReel, LearnSlide, QuizReel, Reel } from './schema';

const LEVEL = { beginner: 0, intermediate: 1, advanced: 2 } as const;
/** Curriculum order: easiest level first, then the topic order of content/curriculum.json. */
const TOPIC_ORDER = (curriculumJson as Curriculum).topics.map(t => t.name);
const topicRank = (topic: string) => {
  const i = TOPIC_ORDER.indexOf(topic);
  return i === -1 ? TOPIC_ORDER.length : i;
};
const byCurriculum = <T extends { level: keyof typeof LEVEL; topic: string }>(a: T, b: T) =>
  LEVEL[a.level] - LEVEL[b.level] || topicRank(a.topic) - topicRank(b.topic);

// The JSON is checked by `npm run validate` before every build, so it is trusted here.
export const learnReels: readonly LearnReel[] = (learnJson as LearnReel[])
  .slice()
  .sort(byCurriculum);
export const quizReels: readonly QuizReel[] = (quizJson as QuizReel[]).slice().sort(byCurriculum);

export const topics: readonly string[] = [
  ...new Set([...learnReels, ...quizReels].map(r => r.topic)),
].sort((a, b) => topicRank(a) - topicRank(b));

/** First code snippet of a learn reel, for previews. */
export function previewCode(reel: LearnReel): { code: string; highlight?: number[] } | null {
  const slide = reel.slides.find(s => s.code);
  return slide?.code ? { code: slide.code, highlight: slide.highlight } : null;
}
