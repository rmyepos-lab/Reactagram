# Hookd: instructions for Claude (coding)

Save this file as `CLAUDE.md` at the root of the repository. Claude Code reads it automatically at the start of every session. You can also paste it at the top of a chat.

## 1. What we are building

Hookd is an Android app that teaches React in about 10 minutes a day with Instagram-style reels.
- Tabs: Home, Explore, Learn, Quiz, Profile.
- **Learn reels:** an endless vertical feed of narrated lessons.
- **Quiz reels:** one question per screen, the answers, an Explanation section, then a Next button.
- **Content:** JSON files in `content/reels/learn` and `content/reels/quiz`, checked by the zod schema in `lib/schema.ts`. The content is generated offline by a scheduled Claude Code session, never by the app at runtime.
- **Approved design:** https://claude.ai/artifact/Kq59JCQgRGRnQPM1VsRdDW (boards 0 to 7). Match it.

## 2. Fixed stack. Do not change it without asking me.

- **Core:** bare React Native **0.87.1**, React **19.2.3**, TypeScript, New Architecture on.
  - **No Expo**: no `expo-*` packages and no Expo modules.
- **Tooling:**
  - CLI: `@react-native-community/cli` 20.2.0
  - Presets: `@react-native/babel-preset`, `@react-native/metro-config` and `@react-native/typescript-config`, all at 0.87.1
- **Navigation:**
  - `@react-navigation/native` 7.5.1
  - `@react-navigation/bottom-tabs` 7.21.0
  - `@react-navigation/native-stack` 7.21.0
  - `react-native-screens` 4.30.1
  - `react-native-safe-area-context` 5.11.1
- **Animation and gestures:**
  - `react-native-reanimated` 4.7.1 with `react-native-worklets` 0.13.1
  - `react-native-gesture-handler` 3.5.0
- **Voice-over:** `@mhpdev/react-native-speech` 1.4.4. It uses the phone's own text-to-speech, so it's free and works offline.
- **Graphics:** `react-native-svg` 15.16.1
- **Storage:** `@react-native-async-storage/async-storage` 3.1.1
- **Code coloring:** `sugar-high` 2.6.4
- **Validation:** `zod` 4.6.7
- **Ads:** `react-native-applovin-max` 9.6.0, native ads only.
  - **Never use AdMob** (`react-native-google-mobile-ads`).
- **Splash screen:** the Android 12+ SplashScreen API (`androidx.core:core-splashscreen`). No custom JavaScript splash screen.
- **Pro:** a Lemon Squeezy license key, checked with the Lemon Squeezy License API (activate / validate). No Google Play Billing and no checkout inside the app.
- **Build:** a GitHub Actions workflow builds the debug APK. Requirements: Node 22.13+, JDK 17, Android SDK.

## 3. Rules that prevent mistakes

1. **Never invent APIs.** Before you use a function, prop, option or Gradle setting of a library, check it in `node_modules/<pkg>` (types, README) or in that version's official docs.
   - If you can't check it, say "I could not verify X" and ask.
   - Don't guess.
2. **Pin versions.**
   - Use only the versions in section 2.
   - Never add, remove or upgrade a package without asking first. Tell me why it's needed and what it costs.
3. **Expo is not available.** Advice written for Expo (`expo-router`, `expo-av`, `app.json` plugins, EAS) doesn't apply here. Use the bare React Native or Android-native equivalent.
4. **Small steps.**
   - Change only the files the task needs, and don't refactor code that wasn't asked about.
   - Before writing code, list the files you'll touch.
5. **Read before you edit.** Open the current file, and match its existing patterns and names.
6. **Check your work before saying it's done.**
   - Run `npx tsc --noEmit` and `npx eslint .`, the tests, and `npm run validate` (reel checker) when content changes.
   - Paste failures exactly as they appear. Never say something passes if you didn't run it.
7. **Native setup.**
   - Any change to `android/` (Gradle, `AndroidManifest.xml`, `MainApplication`) must follow the library's install guide for React Native 0.87.
   - Include the exact lines you added.
8. **Keep secrets out of the repo.** API keys and the AppLovin SDK key never go in the repo; they come from build config or CI secrets. Never print secrets.
9. **When unsure, ask.** If the design, the behavior or a rule isn't clear, ask one short question instead of picking for me.
10. **Be honest about status.** Say clearly what is unfinished, stubbed or untested.

## 4. Product rules the code must follow

- **Ads, Learn feed:** 1 native "Sponsored" reel every 7 reels.
  - It sits inside the stream: full screen, muted, skipped with one swipe.
  - The ••• menu offers Hide this ad, Why am I seeing this, and Remove all ads with Pro.
- **Ads, Home feed:** 1 sponsored post every 6 posts.
- **Ads, Quiz feed (Smart Skip):** an ad slot comes after every 6 quizzes, and it's skipped when at least 5 of those 6 were answered correctly.
- **Never show:** interstitials, app-open ads, rewarded ads, banners over lessons, or ads next to quiz answers.
- **Free plan:** Learn and Quiz reels never end. There's no daily limit.
- **Pro:** removes every ad. The Pro status is cached on the phone and re-validated from time to time.
- **Reviews:** a wrong quiz answer comes back after 1, 3 and 7 days.
- **Accessibility:**
  - Touch targets are at least 48dp.
  - Every icon-only button has an `accessibilityLabel`.
  - Text has a contrast ratio of at least 4.5:1.

## 5. Design tokens (from board 7)

**Colors, light screens:**
- surface `#FBF9F6`, container `#F2EFEA`, border `#E6E1D9`
- text `#1C1B1F`, text variant `#4A4740`, muted text `#5F5B54`
- primary `#087EA4` (ledge `#05607E`), primary container `#CDEBF5`, on primary container `#00374A`
- Pro `#6B4FA0` (ledge `#4A3478`), Pro container `#E9DDFF`, on Pro container `#3A2668`
- correct `#2F7D32` on `#D8EFD5`; wrong `#B3261E` on `#FCE4E2`
- streak `#C2541B` on `#FFE3D1`; tip `#F6E7C1` with text `#3D2E00`

**Colors, reels (dark):**
- background `#17191C`, chips `#2A2D31`, code background `#22252A`
- text `#ECEFF4`, muted text `#A9B0BA`
- Learn accent `#5DB4D2`
- code colors: keyword `#D08770`, function `#88C0D0`, number `#EBCB8B`

**Fonts:** Nunito 600 to 900 for text, JetBrains Mono for code. Bundle the font files in the app.

**Shapes and components:**
- Corner radii: 12, 16, 20, 24, 28, and full (pill).
- Bottom navigation: 80dp tall, with labels and a 64×32 pill behind the active tab.
- Pressable buttons: a 4dp darker bottom edge, 900-weight uppercase label.

## 6. How to answer

1. Plan: the files and steps, in a few lines.
2. The code changes.
3. The commands you ran and their results.
4. What's left or untested.

Keep explanations short and plain.
