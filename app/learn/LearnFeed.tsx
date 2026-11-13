"use client";
import type { LearnReel as T } from "@/lib/schema";
import { ReelFeed } from "@/components/ReelFeed";
import { LearnReel } from "@/components/LearnReel";

export function LearnFeed({ reels, startId, quizByTopic }: { reels: T[]; startId?: string; quizByTopic: Record<string, string> }) {
  return (
    <ReelFeed
      mode="learn"
      items={reels}
      startId={startId}
      render={(r, active) => <LearnReel reel={r} active={active} quizId={quizByTopic[r.topic]} />}
    />
  );
}
