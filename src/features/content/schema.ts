import { z } from "zod";

/** One line of narration. Kept short so speech engines don't cut it off. */
const say = z.string().min(3).max(320);

export const learnSlideSchema = z.object({
  type: z.enum(["title", "text", "code"]),
  /** Big on-screen text (title/text slides) or caption under code. */
  text: z.string().max(220).optional(),
  code: z.string().max(900).optional(),
  /** 1-based line numbers to highlight in `code`. */
  highlight: z.array(z.number().int().positive()).optional(),
  say,
});

const slug = z.string().regex(/^[a-z0-9-]+$/);
const level = z.enum(["beginner", "intermediate", "advanced"]);

/**
 * content/curriculum.json: every concept the app should teach, grouped by topic.
 * Each reel points at one concept, so `npm run coverage` can list what is still missing.
 */
export const curriculumSchema = z.object({
  topics: z
    .array(
      z.object({
        name: z.string().min(2),
        track: z.enum(["core", "internals"]),
        concepts: z
          .array(
            z.object({
              id: slug,
              title: z.string().min(3).max(90),
              level,
              source: z.url(),
              /** Concept ids a learner should have seen first. */
              requires: z.array(slug).optional(),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
});

const base = {
  id: slug,
  /** Must equal a topic name in content/curriculum.json. */
  topic: z.string().min(2),
  /** Id of the curriculum concept this reel teaches or tests. */
  concept: slug,
  level,
  tags: z.array(z.string()).min(1),
  sourceUrl: z.url(),
};

export const learnReelSchema = z
  .object({
    ...base,
    kind: z.literal("learn"),
    format: z.enum(["concept", "special-use", "pitfall", "compare", "pattern"]),
    title: z.string().min(5).max(80),
    slides: z.array(learnSlideSchema).min(2).max(7),
  })
  .superRefine((reel, ctx) => {
    reel.slides.forEach((s, i) => {
      if (s.type === "code" && !s.code) {
        ctx.addIssue({ code: "custom", message: `slide ${i} is a code slide without code` });
      }
      if (s.type !== "code" && !s.text) {
        ctx.addIssue({ code: "custom", message: `slide ${i} needs text` });
      }
      const lines = s.code ? s.code.split("\n").length : 0;
      s.highlight?.forEach((n) => {
        if (n > lines) ctx.addIssue({ code: "custom", message: `slide ${i} highlights missing line ${n}` });
      });
    });
  });

export const quizReelSchema = z
  .object({
    ...base,
    kind: z.literal("quiz"),
    format: z.enum(["output", "bug-hunt", "which-hook", "true-false", "fill-blank"]),
    question: z.string().min(5).max(160),
    code: z.string().max(700).optional(),
    options: z.array(z.string().min(1).max(90)).min(2).max(4),
    answer: z.number().int().min(0),
    say,
    explanation: z.string().min(10).max(260),
    explainSay: say,
  })
  .superRefine((q, ctx) => {
    if (q.answer >= q.options.length) {
      ctx.addIssue({ code: "custom", message: "answer index out of range" });
    }
    if (new Set(q.options.map((o) => o.trim().toLowerCase())).size !== q.options.length) {
      ctx.addIssue({ code: "custom", message: "duplicate options" });
    }
  });

export const reelSchema = z.union([learnReelSchema, quizReelSchema]);

export type Curriculum = z.infer<typeof curriculumSchema>;
export type LearnSlide =z.infer<typeof learnSlideSchema>;
export type LearnReel = z.infer<typeof learnReelSchema>;
export type QuizReel = z.infer<typeof quizReelSchema>;
export type Reel = LearnReel | QuizReel;
