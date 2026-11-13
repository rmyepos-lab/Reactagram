import { z } from "zod";

/** One line of narration. Kept short so browser speech engines don't cut it off. */
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

const base = {
  id: z.string().regex(/^[a-z0-9-]+$/),
  topic: z.string().min(2),
  level: z.enum(["beginner", "intermediate", "advanced"]),
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

export type LearnSlide = z.infer<typeof learnSlideSchema>;
export type LearnReel = z.infer<typeof learnReelSchema>;
export type QuizReel = z.infer<typeof quizReelSchema>;
export type Reel = LearnReel | QuizReel;
