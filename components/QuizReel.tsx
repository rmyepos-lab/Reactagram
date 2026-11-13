"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { QuizReel as QuizReelT } from "@/lib/schema";
import { useNarrator } from "@/lib/narrator";
import { progress, useProgress } from "@/lib/progress";
import { CodeBlock } from "./CodeBlock";
import { ReelActions } from "./ReelActions";

const FORMAT_LABEL: Record<QuizReelT["format"], string> = {
  output: "🖨️ What's the output?",
  "bug-hunt": "🐛 Bug hunt",
  "which-hook": "🪝 Which Hook?",
  "true-false": "✅ True or false",
  "fill-blank": "✏️ Fill the blank",
};

export function QuizReel({ reel, active, learnId }: { reel: QuizReelT; active: boolean; learnId?: string }) {
  const n = useNarrator();
  const p = useProgress();
  const [picked, setPicked] = useState<number | null>(null);
  const asked = useRef(false);
  const isReview = !!p.review[reel.id] && progress.isDue(reel.id) && picked === null;

  // Read the question aloud once each time the reel becomes active.
  useEffect(() => {
    if (!active) {
      asked.current = false;
      return;
    }
    if (!n.started || asked.current || picked !== null) return;
    asked.current = true;
    const cancel = n.speak(reel.say, () => {});
    return () => {
      cancel();
      asked.current = false;
    };
  }, [active, n, picked, reel.say]);

  function choose(k: number) {
    if (picked !== null) return;
    setPicked(k);
    const correct = k === reel.answer;
    progress.answer(reel.id, correct);
    n.speak((correct ? "Correct! " : "Not quite. ") + reel.explainSay, () => {});
  }

  const correct = picked === reel.answer;

  return (
    <div className="quiz-reel">
      <div className="quiz-top">
        <span className="chip">{FORMAT_LABEL[reel.format]}</span>
        {isReview && <span className="chip review">🔁 Review</span>}
        <span className="chip">{reel.level}</span>
      </div>

      <h2 className="quiz-q">{reel.question}</h2>
      {reel.code && <CodeBlock code={reel.code} small />}

      <div className="options" role="group" aria-label="Answers">
        {reel.options.map((opt, k) => {
          const state = picked === null ? "" : k === reel.answer ? "right" : k === picked ? "wrong" : "faded";
          return (
            <button key={k} className={`option ${state}`} disabled={picked !== null} onClick={() => choose(k)}>
              <span className="letter">{String.fromCharCode(65 + k)}</span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <div className={`feedback ${correct ? "ok" : "bad"}`}>
          <strong>{correct ? "✅ Correct! +XP" : "❌ Not quite"}</strong>
          <p>{reel.explanation}</p>
          {!correct && <p className="muted">🔁 This one comes back tomorrow.</p>}
          <div className="feedback-actions">
            {learnId && <Link className="btn ghost" href={`/learn?start=${learnId}`}>Watch the lesson</Link>}
            <span className="muted swipe-hint">Swipe up for next ↑</span>
          </div>
        </div>
      )}

      <ReelActions id={reel.id} title={reel.question} sourceUrl={reel.sourceUrl} />
    </div>
  );
}
