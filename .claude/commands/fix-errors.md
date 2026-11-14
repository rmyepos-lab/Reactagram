---
description: Fix console errors one at a time, with short explanations
argument-hint: [paste the error, or leave empty to read the phone log]
---
Fix the console errors below, one at a time.

Input:
- If nothing is pasted under "Errors:", read them yourself: `adb logcat -d -t 100 ReactNativeJS:W *:S`
- If the text is a question and not an error, answer it in 3 lines and skip the steps.

For each error, in this order:
1. Cause: one sentence in plain words, no jargon.
2. Fix: the file and line, then only the old line and the new line.
3. Stop and show buttons with the question tool, each with a short description:
   - Apply: make this change, then go straight to the next error.
   - Apply all: make this change and every following fix without stopping.
   - Skip: leave this error and go to the next one.
   Do not edit files or run commands before I choose.

Rules:
- Start with the first error in the log. Later errors are often caused by it.
- Ignore warnings, repeated errors and stack lines inside `node_modules`. Use the first stack line that points into `src/`.
- Read only the files named in the error, and only about 20 lines around the line number. Do not explore the project.
- Do not refactor or tidy anything else.
- If two errors have the same cause, say so and fix them together.
- If you are not sure of the cause, say so and tell me what to check. Do not guess.
- Keep each answer under 8 lines. No summaries, no recap.
- After the last fix, and only if a file in `src/` changed, run `npm run check 2>&1 | tail -30` once and paste any failure exactly.

Errors:
$ARGUMENTS
