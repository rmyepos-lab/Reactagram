"use client";
import Link from "next/link";
import { useProgress } from "@/lib/progress";
import { LogoMark } from "@/components/Logo";

type Item = { id: string; kind: "learn" | "quiz"; title: string; topic: string };

export function ProfileClient({ all }: { all: Item[] }) {
  const p = useProgress();
  const answered = Object.values(p.answered);
  const accuracy = answered.length ? Math.round((answered.filter((a) => a.correct).length / answered.length) * 100) : 0;
  const topics = [...new Set(all.map((i) => i.topic))].map((t) => {
    const items = all.filter((i) => i.topic === t);
    return { t, done: items.filter((i) => p.seen.includes(i.id)).length, total: items.length };
  });
  const saved = all.filter((i) => p.saved.includes(i.id));
  const reviews = Object.keys(p.review).length;

  return (
    <div className="profile">
      <header className="profile-head">
        <span className="avatar big"><LogoMark size={44} /></span>
        <div className="profile-stats">
          <div><strong>🔥 {p.streak}</strong><small>day streak</small></div>
          <div><strong>⚡ {p.xp}</strong><small>XP</small></div>
          <div><strong>{accuracy}%</strong><small>quiz accuracy</small></div>
        </div>
      </header>
      {reviews > 0 && <p className="note">🔁 {reviews} quiz{reviews > 1 ? "zes" : ""} queued for review</p>}

      <h2>Progress by topic</h2>
      <ul className="topic-progress">
        {topics.map(({ t, done, total }) => (
          <li key={t}>
            <span>{t}</span>
            <span className="bar"><span style={{ width: `${(done / total) * 100}%` }} /></span>
            <small>{done}/{total}</small>
          </li>
        ))}
      </ul>

      <h2>Saved</h2>
      {saved.length ? (
        <div className="grid">
          {saved.map((i) => (
            <Link key={i.id} href={`/${i.kind}?start=${i.id}`} className={`tile ${i.kind}`}>
              <span className="tile-kind">{i.kind === "learn" ? "▶ Learn" : "🧠 Quiz"}</span>
              <span className="tile-title">{i.title}</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="muted">Tap 🔖 on any reel to save it here.</p>
      )}

      <div className="pro-card">
        <strong>Pro</strong>
        <p className="muted">All tracks, unlimited reels, offline packs. Payments arrive in step 3 (Lemon Squeezy).</p>
      </div>
    </div>
  );
}
