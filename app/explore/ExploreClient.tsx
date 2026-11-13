"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useProgress } from "@/lib/progress";

type Item = { id: string; kind: "learn" | "quiz"; title: string; topic: string; tags: string[]; level: string };

export function ExploreClient({ items, initialQuery }: { items: Item[]; initialQuery: string }) {
  const [q, setQ] = useState(initialQuery);
  const p = useProgress();
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((i) => [i.title, i.topic, ...i.tags].some((t) => t.toLowerCase().includes(s)));
  }, [q, items]);
  const topics = [...new Set(items.map((i) => i.topic))];

  return (
    <div className="explore">
      <input className="search" placeholder="Search hooks, state, effects…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search reels" />
      <div className="chips-row">
        {topics.map((t) => (
          <button key={t} className={`chip ${q === t ? "on" : ""}`} onClick={() => setQ(q === t ? "" : t)}>{t}</button>
        ))}
      </div>
      <div className="grid">
        {results.map((i) => (
          <Link key={i.id} href={`/${i.kind}?start=${i.id}`} className={`tile ${i.kind}`}>
            <span className="tile-kind">{i.kind === "learn" ? "▶ Learn" : "🧠 Quiz"}</span>
            <span className="tile-title">{i.title}</span>
            <span className="tile-topic">{i.topic}{p.seen.includes(i.id) ? " · ✓" : ""}</span>
          </Link>
        ))}
        {!results.length && <p className="muted">No reels yet for “{q}”. New ones are generated nightly.</p>}
      </div>
    </div>
  );
}
