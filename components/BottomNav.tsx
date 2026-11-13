"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, QuizIcon, ReelIcon, SearchIcon, UserIcon } from "./Icons";

const tabs = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/explore", label: "Explore", Icon: SearchIcon },
  { href: "/learn", label: "Learn Reels", Icon: ReelIcon },
  { href: "/quiz", label: "Quiz Reels", Icon: QuizIcon },
  { href: "/profile", label: "Profile", Icon: UserIcon },
];

export function BottomNav() {
  const path = usePathname();
  const onReels = path.startsWith("/learn") || path.startsWith("/quiz");
  return (
    <nav className={`bottom-nav ${onReels ? "on-reels" : ""}`} aria-label="Main">
      {tabs.map(({ href, label, Icon }) => {
        const active = href === "/" ? path === "/" : path.startsWith(href);
        return (
          <Link key={href} href={href} aria-label={label} aria-current={active ? "page" : undefined} className={active ? "active" : ""}>
            <Icon filled={active} />
          </Link>
        );
      })}
    </nav>
  );
}
