"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { LearnReel as LearnReelT } from "@/lib/schema";
import { readingTime, useNarrator } from "@/lib/narrator";
import { progress } from "@/lib/progress";
import { CodeBlock } from "./CodeBlock";
import { ReelActions } from "./ReelActions";

const FORMAT_LABEL: Record<LearnReelT["format"], string> = {
  concept: "💡 Concept",
  "special-use": "✨ Special use",
  pitfall: "⚠️ Pitfall",
  compare: "⚔️ Compare",
  pattern: "🛠️ Pattern",
};

export function LearnReel({ reel, active, quizId }: { reel: LearnReelT; active: boolean; quizId?: string }) {
  const n = useNarrator();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState(false);
  const last = reel.slides.length - 1;
  const slide = reel.slides[i];

  // Leaving the reel rewinds it.
  useEffect(() => {
    if (!active) {
      setI(0);
      setPaused(false);
      setDone(false);
    }
  }, [active]);

  // Play: narrate the current slide, then advance.
  useEffect(() => {
    if (!active || !n.started || paused || done) return;
    return n.speak(slide.say, () => {
      if (i < last) setI(i + 1);
      else {
        setDone(true);
        progress.markSeen(reel.id);
      }
    });
  }, [active, n, paused, done, i, last, slide.say, reel.id]);

  function onTap(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    n.stop();
    if (done) {
      setDone(false);
      setI(0);
      setPaused(false);
    } else if (x < 0.3) {
      setI(Math.max(0, i - 1));
      setPaused(false);
    } else if (x > 0.7) {
      if (i < last) setI(i + 1);
      else {
        setDone(true);
        progress.markSeen(reel.id);
      }
      setPaused(false);
    } else setPaused((p) => !p);
  }

  return (
    <div className="learn-reel" onClick={onTap}>
      <div className="stories-bar" aria-hidden>
        {reel.slides.map((s, k) => (
          <span
            key={k}
            className={k < i || done ? "full" : k === i && n.started && active ? (paused ? "current paused" : "current") : ""}
            style={{ ["--d" as string]: `${readingTime(s.say)}ms` }}
          />
        ))}
      </div>

      <div className="slide" key={`${reel.id}-${i}`}>
        {slide.type === "title" && <h2 className="slide-title">{slide.text}</h2>}
        {slide.type === "text" && <p className="slide-text">{slide.text}</p>}
        {slide.type === "code" && (
          <>
            <CodeBlock code={slide.code!} lines={slide.highlight} />
            {slide.text && <p className="slide-caption">{slide.text}</p>}
          </>
        )}
        <p className="subtitle" aria-live="polite">{slide.say}</p>
      </div>

      {paused && !done && <div className="paused-badge">❚❚</div>}
      {done && (
        <div className="done-card" onClick={(e) => e.stopPropagation()}>
          <p>+5 XP ⚡</p>
          <button className="btn ghost" onClick={() => { setDone(false); setI(0); }}>↺ Replay</button>
          {quizId && <Link className="btn" href={`/quiz?start=${quizId}`}>Quiz me on {reel.topic} →</Link>}
        </div>
      )}

      <ReelActions id={reel.id} title={reel.title} sourceUrl={reel.sourceUrl} />

      <div className="reel-meta">
        <span className="chip">{FORMAT_LABEL[reel.format]}</span>
        <span className="chip">{reel.level}</span>
        <h3>{reel.title}</h3>
        <p className="muted">#{reel.topic.replace(/\s/g, "")} {reel.tags.map((t) => `#${t}`).join(" ")}</p>
      </div>
    </div>
  );
}
