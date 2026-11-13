"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { orderFeed, progress } from "@/lib/progress";
import { useNarrator } from "@/lib/narrator";
import { SoundIcon } from "./Icons";

type Props<T extends { id: string }> = {
  items: T[];
  startId?: string;
  mode: "learn" | "quiz";
  render: (item: T, active: boolean) => ReactNode;
};

/** Full-screen vertical swipe feed (CSS scroll-snap). Exactly one reel is "active" at a time. */
export function ReelFeed<T extends { id: string }>({ items, startId, mode, render }: Props<T>) {
  const [ordered, setOrdered] = useState(items);
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const n = useNarrator();

  // Order once on mount (due reviews → unseen → seen). Never reorder while the user scrolls.
  useEffect(() => {
    setOrdered(orderFeed(items, progress.get(), startId));
    box.current?.scrollTo({ top: 0 });
  }, [items, startId]);

  useEffect(() => {
    const root = box.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
      },
      { root, threshold: 0.6 },
    );
    root.querySelectorAll("[data-index]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ordered]);

  useEffect(() => () => n.stop(), [n]);

  return (
    <div className="reels-page">
      <header className="reels-header">
        <div className="reels-switch">
          <Link href="/learn" className={mode === "learn" ? "on" : ""}>Learn</Link>
          <Link href="/quiz" className={mode === "quiz" ? "on" : ""}>Quiz</Link>
        </div>
        <button className="icon-btn" onClick={n.toggleMute} aria-label={n.muted ? "Unmute voice-over" : "Mute voice-over"}>
          <SoundIcon muted={n.muted} size={24} />
        </button>
      </header>

      <div className="reels" ref={box}>
        {ordered.map((item, i) => (
          <section className="reel" key={item.id} data-index={i}>
            {render(item, i === active)}
          </section>
        ))}
        <section className="reel reel-end">
          <p>🎉 You&apos;re all caught up!</p>
          <p className="muted">New reels drop every night.</p>
          <Link className="btn" href={mode === "learn" ? "/quiz" : "/learn"}>{mode === "learn" ? "Test yourself in Quiz Reels →" : "Back to Learn Reels →"}</Link>
        </section>
      </div>

      {!n.started && (
        <button className="tap-to-start" onClick={n.start}>
          <span className="pulse">▶</span>
          <strong>Tap to start</strong>
          <span className="muted">Reels have voice-over 🔊</span>
        </button>
      )}
    </div>
  );
}
