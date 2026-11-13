type P = { size?: number; filled?: boolean };
const s = (size = 26) => ({ width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const });

export const HomeIcon = ({ size, filled }: P) => (
  <svg {...s(size)} fill={filled ? "currentColor" : "none"}><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" /></svg>
);
export const SearchIcon = ({ size }: P) => (
  <svg {...s(size)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
);
export const ReelIcon = ({ size, filled }: P) => (
  <svg {...s(size)}><rect x="3" y="3" width="18" height="18" rx="5" fill={filled ? "currentColor" : "none"} /><path d="M3 8h18M8 3l3 5M14 3l3 5" stroke={filled ? "var(--bg)" : "currentColor"} /><path d="m10 11.5 4.5 2.5-4.5 2.5z" fill={filled ? "var(--bg)" : "currentColor"} stroke="none" /></svg>
);
export const QuizIcon = ({ size, filled }: P) => (
  <svg {...s(size)}><circle cx="12" cy="12" r="9" fill={filled ? "currentColor" : "none"} /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.4" stroke={filled ? "var(--bg)" : "currentColor"} /><circle cx="12" cy="17" r=".6" fill={filled ? "var(--bg)" : "currentColor"} /></svg>
);
export const UserIcon = ({ size, filled }: P) => (
  <svg {...s(size)} fill={filled ? "currentColor" : "none"}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>
);
export const HeartIcon = ({ size, filled }: P) => (
  <svg {...s(size)} fill={filled ? "currentColor" : "none"}><path d="M12 20s-7-4.4-9.2-8.6C1.4 8.6 3 5 6.6 5c2 0 3.3 1.1 4.1 2.3h2.6C14.1 6.1 15.4 5 17.4 5 21 5 22.6 8.6 21.2 11.4 19 15.6 12 20 12 20z" /></svg>
);
export const BookmarkIcon = ({ size, filled }: P) => (
  <svg {...s(size)} fill={filled ? "currentColor" : "none"}><path d="M6 3h12v18l-6-4.5L6 21z" /></svg>
);
export const ShareIcon = ({ size }: P) => (
  <svg {...s(size)}><path d="M21 3 10 14M21 3l-7 18-4-7-7-4z" /></svg>
);
export const LinkIcon = ({ size }: P) => (
  <svg {...s(size)}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>
);
export const SoundIcon = ({ size, muted }: P & { muted?: boolean }) => (
  <svg {...s(size)}><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />{muted ? <path d="m17 9 5 6M22 9l-5 6" /> : <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />}</svg>
);
export const FireIcon = ({ size }: P) => (
  <svg {...s(size)} fill="currentColor" stroke="none"><path d="M12 2s5 4.5 5 10a5 5 0 0 1-10 0c0-2.2 1-3.6 2-4.5 0 1.8 1 3 2 3 0-3.5 1-6.2 1-8.5z" /></svg>
);
