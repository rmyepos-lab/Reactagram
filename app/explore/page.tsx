import { getLearnReels, getQuizReels } from "@/lib/reels";
import { ExploreClient } from "./ExploreClient";

export const metadata = { title: "Explore" };

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const items = [
    ...getLearnReels().map((r) => ({ id: r.id, kind: "learn" as const, title: r.title, topic: r.topic, tags: r.tags, level: r.level })),
    ...getQuizReels().map((r) => ({ id: r.id, kind: "quiz" as const, title: r.question, topic: r.topic, tags: r.tags, level: r.level })),
  ];
  return <ExploreClient items={items} initialQuery={q ?? ""} />;
}
