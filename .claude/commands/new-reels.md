---
description: Generate new Learn and Quiz reels for uncovered curriculum concepts
argument-hint: [topic name] [number of concepts, default 5]
---
Generate new reels for Hookd. Arguments: $ARGUMENTS
- If a topic name is given (it must match a topic in `content/curriculum.json`), work only on that topic.
- If a number is given, cover that many concepts. The default is 5.
- With no topic, pick gaps from several topics and levels.

## 1. See what exists
- Run `npm run coverage`, or `npm run coverage -- --topic "<topic>"`, to see the concepts, which are done and the reels they already have.
- Don't read the reel files one by one. The coverage output lists their titles and questions.

## 2. Complete the coverage map first (topic runs)
- Open every `source` page of the topic with WebFetch, plus the reference page of each API it mentions.
- List everything the docs teach about the topic:
  - each API and option
  - each usage pattern and technique
  - each pitfall, caveat and "troubleshooting" entry
  - each comparison (A vs B)
- Add each item that's missing as a new concept in `content/curriculum.json`:
  - Fields: a unique kebab-case `id`, a short `title`, a `level`, a `source` URL (with the `#anchor` when there is one) and `requires` for prerequisite concept ids.
  - One idea per concept, small enough for a 30–60 second reel.
- Internals (topic "How React Works") can also come from the legacy docs, the React blog or the React repo. Keep it accurate and say when something is simplified. The "virtual DOM" is the popular name for the tree of React elements; react.dev doesn't use that term.

## 3. Pick concepts
- Take uncovered concepts whose `requires` already have a learn reel, from the "Next gaps" list.
- Without a topic argument, mix topics and levels. Don't take several from one topic.

## 4. Write the reels (for each concept)
Facts come only from the concept's `source` page, which you opened in this run, for React 19.2. If the docs don't say it, don't teach it.

**1 Learn reel:** `content/reels/learn/<id>.json`
- Fields: `kind: "learn"`, `id` (equals the file name), `topic` (exactly the curriculum topic name), `concept`, `format` (concept | special-use | pitfall | compare | pattern), `level`, `tags`, `sourceUrl`, `title` (5–80 chars), `slides` (2–7).
- **Slides:**
  - `title`, `text` or `code`.
  - `text` up to 220 chars.
  - `code` up to 900 chars, at most about 14 lines of 40 characters each (phone width).
  - `highlight` is a list of 1-based line numbers.
  - Each slide has a `say` line of up to 320 chars.
  - `visual`: a diagram, when a picture explains better than code. At most one per reel. Use it for structure (which component renders which, where state lives, how props flow) or order (render → commit → effect → cleanup). Skip it when code says it better.
    - Tree: `"visual": { "kind": "tree", "nodes": [{ "id": "app", "label": "App" }, { "id": "list", "label": "List", "parent": "app", "note": "items" }] }`. The first node is the root; every other node names a parent listed before it. At most 10 nodes, 4 leaves, 4 rows. `label` max 18 chars (a component name), `note` max 24 (a prop or state).
    - Timeline: `"visual": { "kind": "timeline", "events": [{ "id": "render", "label": "Render", "note": "count is 0" }] }`. 2–6 events in time order. `label` max 28, `note` max 40.
    - `steps` (optional, 1–4): `[{ "say": "...", "show": ["list"], "focus": "list" }]`. The slide's `say` plays first, showing every item no step names. Each step then plays its own line, adds its `show` items, and highlights `focus`. Each item is shown by one step at most, a tree node never appears before its parent, and `focus` must be on screen. Write the lines so they talk about what just appeared.
    - Optional `text` is a caption shown under the diagram.
- **Shape:**
  - Start with a hook, then one idea per slide, then real code, then a one-line takeaway.
  - Each reel shows something no other reel shows: a different usage, technique or pitfall.
- **Narration (`say`):** spoken English, short sentences, friendly. Write Hook names as they sound ("use effect", "use layout effect"). No symbols that sound wrong when read aloud.

**2–3 Quiz reels:** `content/reels/quiz/quiz-<id>-<n>.json`
- Fields: `kind: "quiz"`, `id`, `topic`, `concept`, `format` (output | bug-hunt | which-hook | true-false | fill-blank), `level`, `tags`, `sourceUrl`, `question` (max 160), optional `code` (max 700), `options` (2–4, max 90 each), `answer` (0-based index), `say` (reads the question), `explanation` (max 260), `explainSay`.
- Each quiz tests the concept from a **different angle** with a different format, not a reworded copy.
- Vary the position of the correct answer. Wrong options must be believable mistakes.
- Work through every code snippet in your head and confirm the answer is right.

## 5. No redundancy
- Before writing, compare against the existing reels of the same topic (from step 1).
- If a new reel would repeat one, pick another angle or skip the concept.
- The validator refuses a second learn reel for a concept, more than 3 quizzes per concept, and near-duplicate wording.

## 6. Check
- Run `npm run check` once at the end and fix every failure.
- Run `npm run coverage` again for the before → after numbers.

## 7. Narration
- Run `npm run narration`. It records new lines with Kokoro, and uploads them only if `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set in the shell.
- If Python or Kokoro isn't available, skip this step and say so. The app falls back to the phone's own voice.

## 8. Report (short)
- concepts added to the map
- the reels created (ids)
- coverage before → after
- the `npm run check` result
- anything skipped

Don't commit unless asked.
