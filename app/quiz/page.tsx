import { getLearnReels, getQuizReels } from "@/lib/reels";
import { QuizFeed } from "./QuizFeed";

export const metadata = { title: "Quiz Reels" };

export default async function QuizPage({ searchParams }: { searchParams: Promise<{ start?: string }> }) {
  const { start } = await searchParams;
  const learnByTopic = Object.fromEntries(getLearnReels().map((l) => [l.topic, l.id]).reverse());
  return <QuizFeed reels={getQuizReels()} startId={start} learnByTopic={learnByTopic} />;
}
