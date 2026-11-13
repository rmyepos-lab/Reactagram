import { getLearnReels, getQuizReels } from "@/lib/reels";
import { LearnFeed } from "./LearnFeed";

export const metadata = { title: "Learn Reels" };

export default async function LearnPage({ searchParams }: { searchParams: Promise<{ start?: string }> }) {
  const { start } = await searchParams;
  const quizzes = getQuizReels();
  const quizByTopic = Object.fromEntries(quizzes.map((q) => [q.topic, q.id]).reverse());
  return <LearnFeed reels={getLearnReels()} startId={start} quizByTopic={quizByTopic} />;
}
