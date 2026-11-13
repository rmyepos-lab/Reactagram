"use client";
import { progress, useProgress } from "@/lib/progress";
import { BookmarkIcon, HeartIcon, LinkIcon, ShareIcon } from "./Icons";

export function ReelActions({ id, title, sourceUrl }: { id: string; title: string; sourceUrl: string }) {
  const p = useProgress();
  const liked = p.liked.includes(id);
  const saved = p.saved.includes(id);

  async function share() {
    const url = `${location.origin}${location.pathname}?start=${id}`;
    try {
      if (navigator.share) await navigator.share({ title, url });
      else await navigator.clipboard.writeText(url);
    } catch {
      /* user cancelled */
    }
  }

  return (
    <div className="reel-actions" onClick={(e) => e.stopPropagation()}>
      <button aria-label="Like" aria-pressed={liked} className={liked ? "liked" : ""} onClick={() => progress.toggleLike(id)}>
        <HeartIcon filled={liked} size={30} />
      </button>
      <button aria-label="Save" aria-pressed={saved} onClick={() => progress.toggleSave(id)}>
        <BookmarkIcon filled={saved} size={28} />
      </button>
      <button aria-label="Share" onClick={share}>
        <ShareIcon size={28} />
      </button>
      <a aria-label="Read the source docs" href={sourceUrl} target="_blank" rel="noreferrer">
        <LinkIcon size={28} />
      </a>
    </div>
  );
}
