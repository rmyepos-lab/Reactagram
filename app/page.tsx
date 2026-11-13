import Link from "next/link";
import { getLearnReels, getQuizReels, getTopics } from "@/lib/reels";
import { Wordmark } from "@/components/Logo";
import { StatsPill } from "@/components/StatsPill";
import { CodeBlock } from "@/components/CodeBlock";
import { APP_TAGLINE } from "@/lib/brand";

export default function Home() {
  const learn = getLearnReels();
  const quizzes = getQuizReels();
  const topics = getTopics();
  const dailyQuiz = quizzes[new Date().getDate() % quizzes.length];

  return (
    <div className="home">
      <header className="top-bar">
        <Wordmark />
        <StatsPill />
      </header>

      <div className="stories" aria-label="Topics">
        {topics.map((t) => (
          <Link key={t.topic} href={`/explore?q=${encodeURIComponent(t.topic)}`} className="story">
            <span className="story-ring"><span>{t.topic.replace(/^use/, "").slice(0, 2)}</span></span>
            <small>{t.topic}</small>
          </Link>
        ))}
      </div>

      <p className="tagline">{APP_TAGLINE} ⏱️</p>

      <article className="post daily">
        <div className="post-head"><span className="avatar">🧠</span><strong>Daily quiz</strong><span className="muted">· {dailyQuiz.topic}</span></div>
        <div className="post-body quiz-preview">
          <p>{dailyQuiz.question}</p>
          <Link className="btn" href={`/quiz?start=${dailyQuiz.id}`}>Answer in Quiz Reels →</Link>
        </div>
      </article>

      {learn.map((r) => {
        const code = r.slides.find((s) => s.type === "code");
        return (
          <article className="post" key={r.id}>
            <div className="post-head">
              <span className="avatar">⚛︎</span>
              <strong>{r.topic}</strong>
              <span className="muted">· {r.level}</span>
            </div>
            <Link href={`/learn?start=${r.id}`} className="post-body">
              <h3>{r.title}</h3>
              {code?.code && <CodeBlock code={code.code} lines={code.highlight} animate={false} small />}
              <span className="play-badge">▶ Watch reel · {r.slides.length} slides</span>
            </Link>
            <p className="post-caption"><strong>{r.topic}</strong> {r.slides[1]?.text ?? ""}</p>
          </article>
        );
      })}
    </div>
  );
}
