"use client";
import type { QuizReel as T } from "@/lib/schema";
import { ReelFeed } from "@/components/ReelFeed";
import { QuizReel } from "@/components/QuizReel";

export function QuizFeed({ reels, startId, learnByTopic }: { reels: T[]; startId?: string; learnByTopic: Record<string, string> }) {
  return (
    <ReelFeed
      mode="quiz"
      items={reels}
      startId={startId}
      render={(r, active) => <QuizReel reel={r} active={active} learnId={learnByTopic[r.topic]} />}
    />
  );
}
