# Hookd: instructions for Claude (coding)

Claude Code reads this file at the start of every session.

## 1. What we are building

Hookd is an Android app that teaches React in about 10 minutes a day with Instagram-style reels.
- Tabs: Home, Explore, Learn, Quiz, Profile.
- **Learn reels:** an endless vertical feed of narrated lessons.
- **Quiz reels:** one question per screen, the answers, an Explanation section, then a Next button.
- **Content:** JSON files in `content/reels/learn` and `content/reels/quiz`, checked by the zod schema in `src/features/content/schema.ts`. The content is generated offline by a scheduled Claude Code session, never by the app at runtime.
- **Approved design:** https://claude.ai/artifact/Kq59JCQgRGRnQPM1VsRdDW (boards 0 to 8). Match it.

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
- **Remote config and admin:** Supabase, called with plain `fetch` (no Supabase package). Only the project URL and the anon key are in the app. Never put the `service_role` key, the Lemon Squeezy API key or any other secret in the app or in the `app_config` table.
- **Pro:** not live yet: the Pro card says "Coming soon" until the admin switches `proActivationEnabled` on. Later: a license key bought outside the app and outside Google Play. The app only activates and re-validates the key through the payment provider's license API (the provider isn't chosen yet: ask before writing this part). No Google Play Billing, no checkout and no purchase flow inside the app.
- **Build:** the GitHub Actions workflow `.github/workflows/android.yml` builds a test APK (release variant signed with the debug key, so it runs without a computer). Requirements: Node 22.13+, JDK 17, Android SDK.

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
   - Run `npm run check`. It rebuilds the content index, then runs the reel checker, TypeScript, ESLint and the tests.
   - Paste failures exactly as they appear. Never say something passes if you didn't run it.
7. **Native setup.**
   - Any change to `android/` (Gradle, `AndroidManifest.xml`, `MainApplication`) must follow the library's install guide for React Native 0.87.
   - Include the exact lines you added.
8. **Keep secrets out of the repo.** The AppLovin SDK key, ad unit id, Supabase URL and Supabase anon key come from CI secrets through `scripts/write-env.ts`. The committed `src/config/env.ts` has no keys. Never print secrets.
9. **When unsure, ask.** If the design, the behavior or a rule isn't clear, ask one short question instead of picking for me.
10. **Be honest about status.** Say clearly what is unfinished, stubbed or untested.

## 4. Product rules the code must follow

- **Ads, Learn feed:** 1 native "Sponsored" reel every 7 reels.
  - It sits inside the stream: full screen, muted, skipped with one swipe.
  - The ••• menu offers Hide this ad, Why am I seeing this, and "Have a Pro key? Activate it". It never promotes buying Pro.
- **Ads, Home feed:** 1 sponsored post every 6 posts.
- **Ads, Quiz feed (Smart Skip):** an ad slot comes after every 6 quizzes, and it's skipped when at least 5 of those 6 were answered correctly.
- **Never show:** interstitials, app-open ads, rewarded ads, banners over lessons, or ads next to quiz answers.
- **Free plan:** Learn and Quiz reels never end. There's no daily limit.
- **Pro:** removes every ad. The Pro status is cached on the phone and re-validated from time to time.
- **Admin:** tapping the version line in Profile 7 times opens a hidden Admin screen (only when Supabase is set up). After signing in, the admin can switch ads on or off and edit public settings for all users. The database rules in `supabase/setup.sql` decide who may save; the app is never trusted. Ad frequency rules are fixed in code, not remote.
- **Never promote buying Pro inside the app** (Google Play payments policy):
  - No price, "Buy", "Upgrade", "Get Pro" button, purchase link or text explaining how to buy, anywhere in the app or the Play listing.
  - The Profile Pro card says "Coming soon" while activation is off. When it's on, it only says "Have a Hookd Pro key? Activate it here." with the key field and Activate button.
  - The ad options sheet offers Hide this ad, Why am I seeing this, and, only while activation is on, "Have a Pro key? Activate it" (opens Profile).
  - **Help & guide** opens the help website. That site must never link to the sales site.
  - **Contact us** is neutral: topics Help, Feedback, Problem, Other; email, message, WhatsApp. No mention of Pro or buying.
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

## 6. Project map and code conventions

```
content/reels/{learn,quiz}/*.json   lesson and quiz content
scripts/                            reel checker, content index, env writer
src/App.tsx                         providers and navigation container
src/theme/                          tokens.ts (colors, radii, fonts), motion.ts (springs, durations)
src/config/                         app.ts (name, links), env.ts (ad keys, written by CI)
src/lib/                            createStore, useEndlessFeed, date and format helpers
src/components/ui/                  AppText, Icon, PressableScale, LedgeButton, Chip, BottomSheet...
src/components/reels/               ReelPager, LearnReelCard, QuizReelCard, CodeBlock...
src/features/<name>/                content, progress, ads, pro, remoteConfig, narration, settings
supabase/setup.sql                  config table and admin rules, run once in Supabase
src/navigation/                     RootNavigator, TabBar, types
src/screens/                        one file per screen
__tests__/                          tests for pure logic
```

- **Reuse first.** Before writing a component, look in `src/components/ui`. Text is always `AppText`, tappable things are `PressableScale`, `IconButton` or `LedgeButton`.
- **No raw values.** Colors, radii and fonts come from `src/theme/tokens.ts`. Animation settings come from `src/theme/motion.ts`.
- **Animation:** use Reanimated (`useSharedValue`, `withSpring`, `withTiming`, `entering` animations). Animate only `transform` and `opacity` where possible.
- **Logic stays pure.** Rules live in `features/*/logic.ts` or `policy.ts` as plain functions with tests. Components only call them.
- **State:** use `createStore` from `src/lib/createStore.ts`. Don't add a state library.
- **Imports:** screens import from a feature's `index.ts`, not from its inner files.
- **Remote settings:** to add one, add it to the `RemoteConfig` type, `DEFAULT_CONFIG` and `CONFIG_FIELDS` in `src/features/remoteConfig/schema.ts` and to `supabase/setup.sql`. Read it with `useRemoteConfig('key')`.
- **zod is for scripts only.** Don't import it at runtime in `src/` (type-only imports are fine): the app's Babel preset can't bundle it.
- **Not built yet:** Pro key activation (`src/features/pro/licenseService.ts` is a stub until the payment provider is chosen) and the ad consent flow.

## 7. How to answer

1. Plan: the files and steps, in a few lines.
2. The code changes.
3. The commands you ran and their results.
4. What's left or untested.

Keep explanations short and plain.
