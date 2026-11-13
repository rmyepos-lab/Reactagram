import { APP_NAME } from "@/lib/brand";

/** Original mark: a play button wrapped by a single tilted orbit (not the React logo). */
export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect x="2" y="2" width="28" height="28" rx="9" fill="none" stroke="var(--accent)" strokeWidth="2.2" />
      <path d="M13 10.5v11l9-5.5z" fill="var(--accent)" />
      <ellipse cx="16" cy="16" rx="15" ry="5.2" fill="none" stroke="var(--accent-2)" strokeWidth="1.6" transform="rotate(-32 16 16)" opacity=".9" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="wordmark">
      <LogoMark size={28} />
      <span>{APP_NAME}</span>
    </span>
  );
}
