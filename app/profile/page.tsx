import { getLearnReels, getQuizReels } from "@/lib/reels";
import { ProfileClient } from "./ProfileClient";

export const metadata = { title: "Profile" };

export default function ProfilePage() {
  const all = [
    ...getLearnReels().map((r) => ({ id: r.id, kind: "learn" as const, title: r.title, topic: r.topic })),
    ...getQuizReels().map((r) => ({ id: r.id, kind: "quiz" as const, title: r.question, topic: r.topic })),
  ];
  return <ProfileClient all={all} />;
}
