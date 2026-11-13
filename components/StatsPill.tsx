"use client";
import { useProgress } from "@/lib/progress";
import { FireIcon } from "./Icons";

export function StatsPill() {
  const p = useProgress();
  return (
    <div className="stats-pill" title="Streak · XP">
      <span className="streak"><FireIcon size={16} /> {p.streak}</span>
      <span>⚡ {p.xp}</span>
    </div>
  );
}
