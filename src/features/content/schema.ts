import { z } from "zod";
import { diagramIssues } from "./diagram";

/** One line of narration. Kept short so speech engines don't cut it off. */
const say = z.string().min(3).max(320);

const slug = z.string().regex(/^[a-z0-9-]+$/);

/** A component tree. Each node except the first names its parent, listed before it. */
const treeSchema = z.object({
  kind: z.literal("tree"),
  nodes: z
    .array(
      z.object({
        id: slug,
        label: z.string().min(1).max(18),
        /** Small second line, such as a prop or a piece of state. */
        note: z.string().max(24).optional(),
        parent: slug.optional(),
      }),
    )
    .min(2)
    .max(10),
});

/** Events in time order, drawn top to bottom. */
const timelineSchema = z.object({
  kind: z.literal("timeline"),
  events: z
    .array(
      z.object({
        id: slug,
        label: z.string().min(1).max(28),
        note: z.string().max(40).optional(),
      }),
    )
    .min(2)
    .max(6),
});

/** One extra narration line on a visual slide, played after `say`. */
const diagramStepSchema = z.object({
  say,
  /** Nodes or events that appear when this line starts. */
  show: z.array(slug).optional(),
  /** Node or event highlighted while this line plays. */
  focus: slug.optional(),
});

export const learnSlideSchema = z.object({
  type: z.enum(["title", "text", "code", "visual"]),
  /** Big on-screen text (title/text slides) or caption under code or a diagram. */
  text: z.string().max(220).optional(),
  code: z.string().max(900).optional(),
  /** 1-based line numbers to highlight in `code`. */
  highlight: z.array(z.number().int().positive()).optional(),
  /** The diagram of a visual slide. */
  visual: z.discriminatedUnion("kind", [treeSchema, timelineSchema]).optional(),
  /** Visual slides only: lines that reveal the diagram step by step. */
  steps: z.array(diagramStepSchema).min(1).max(4).optional(),
  say,
});
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
      if ((s.type === "title" || s.type === "text") && !s.text) {
        ctx.addIssue({ code: "custom", message: `slide ${i} needs text` });
      }
      diagramIssues(s).forEach((issue) => {
        ctx.addIssue({ code: "custom", message: `slide ${i}: ${issue}` });
      });
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
export type LearnSlide = z.infer<typeof learnSlideSchema>;
export type Diagram = z.infer<typeof treeSchema> | z.infer<typeof timelineSchema>;
export type DiagramStep = z.infer<typeof diagramStepSchema>;
export type LearnReel = z.infer<typeof learnReelSchema>;
export type QuizReel = z.infer<typeof quizReelSchema>;
export type Reel = LearnReel | QuizReel;
