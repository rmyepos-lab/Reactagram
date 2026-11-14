---
description: Fix console errors one at a time, with short explanations
---
Fix the console errors below, one at a time.

For each error, in this order:
1. Cause: one sentence in plain words, no jargon.
2. Fix: the file and line, and the smallest change that fixes it.
3. stop and wait for me to say "apply" before you executing commands
4. Stop and wait for me to say "next" before the following error.

Rules:
- Start with the first error in the log. Later errors are often caused by it.
- Read only the files named in the error. Do not explore the project.
- Do not refactor or tidy anything else.
- If two errors have the same cause, say so and fix them together.
- If you are not sure of the cause, say so and tell me what to check. Do not guess.
- Keep each answer under 8 lines. No summaries, no recap.
- Run `npm run check` only once, after the last fix, and paste any failure exactly.

Errors:
$ARGUMENTS