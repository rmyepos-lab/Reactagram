# Hookd

Learn React in about 10 minutes a day with Instagram-style reels. Android app, bare React Native (no Expo).

- **Learn reels:** an endless feed of short narrated lessons.
- **Quiz reels:** one question per screen with an explanation.
- **Design:** https://claude.ai/artifact/Kq59JCQgRGRnQPM1VsRdDW

## Commands

| Command | What it does |
|---|---|
| `npm install` | Install dependencies |
| `npm run check` | Content index, reel checker, TypeScript, ESLint, tests |
| `npm start` | Start Metro |
| `npm run android` | Run on a phone or emulator (needs the Android SDK) |

## Get an APK without a computer setup

Every push runs the **Android APK** workflow in GitHub Actions. Open the run and download `hookd-test-apk`.

## Settings to fill in

- `src/config/app.ts`: help website, contact email, WhatsApp number.
- Repository secrets `APPLOVIN_SDK_KEY` and `APPLOVIN_NATIVE_AD_UNIT_ID`: real ads. Without them the app shows sample ads.

Rules for contributors (and for Claude) are in `CLAUDE.md`.
