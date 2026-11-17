---
description: Load the saved context from the last session and continue
---

Load the context below, read the memory file `roadmap-status.md` (in the project memory folder), run `git status --short`, then reply in 5 lines or fewer: where we stopped, what is uncommitted, and the next step. Do not start work, do not explore the project, and do not bring up feature 5. Wait for my instruction.

## Handoff, 2026-11-17

**Focus now:** bugs, app logic and design. Feature 5 (scheduled `/new-reels` routine) is PARKED until I ask (see memory `claude-plan-and-cost.md`).

**Done this session, all UNCOMMITTED:**
- Fox tutor on Learn reels (`src/features/content/tutor.ts` + `__tests__/tutor.test.ts`, `LearnReelCard.tsx`, `content/index.ts`), typing caption, `tokens.ts` (`untyped`), Home fox `wave={false}`. Phone-tested by me.
- Random laptop looks for the fox (NOT yet seen on the phone): the "</>" is gone; 8 looks A–H (plain, glow, paw, atom, lines, heart, spark, light lid) in `Mascot.tsx` (`LidArt`, prop `seed`). Picked by `pickBySeed` in `src/lib/seed.ts` (+ `__tests__/seed.test.ts`): Learn reels use the reel id; Home and Quiz results change once a day (`dayKey()`). Cheer (check) and low (dots) keep their own screen. Book look (I) not used. Picker page: scratchpad `mascot-variants.html` (may be gone).
- `content/narration.json`: 600/676 reels in KV.
- `npm run check` passed (8 suites, 52 tests); 2 no-bitwise lint warnings in seed.ts then fixed with an eslint-disable comment (file re-linted clean).

**Not mine, leave out of commits:** `src/config/app.ts`, `src/screens/QuizScreen.tsx` edits, `scripts/kokoro_tts.py`. My own edits are mixed into `LearnReelCard.tsx`: ask before committing them.

**Pending:**
- When I say "verify github": narration run 43986529114 (last 76 reels). Move the old `.narration/reels/narration-timings.json` aside, `gh run download 43986529114 -n narration-files -D .narration/reels`, `npm run narration:upload -- --max 100`, then commit `narration.json` when I ask.
- Play-button overlap on the paused title slide: waiting for my choice.
- VirtualizedList "slow to update" warning: not handled.
- Portrait lock: parked until release (memory `before-release-fixes.md`).

**How to run:** Metro with `npm start` (check port 8081 first, don't start twice); `adb reverse tcp:8081 tcp:8081`; `adb shell am force-stop com.hookd.app`; `adb shell monkey -p com.hookd.app 1`. Wireless adb drops: `adb mdns services`, `adb connect <ip:port>`. adb can't tap, but screenshots work: `adb exec-out screencap -p > <scratchpad>/shot.png`. Never build APKs locally.

**My preferences:** offer choices as plain text, not popups (I reject the question tool). Run `npm run check` once, at the end. Commit only when I ask.

**Next:** I check the fox laptop looks on the phone; fix what I report; commit when I say so.
