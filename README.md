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

## Builds

A push only runs the quick code checks. No APK is built automatically.

To build one: GitHub > Actions > **Android** > Run workflow, then pick:

| Choice | What you get |
|---|---|
| `dev-apk` | Debug app that loads the JavaScript from your computer. For daily testing. |
| `test-apk` | Standalone app with the JavaScript inside, signed with the debug key. |

## Test on your phone without a slow local build

Your computer never has to compile Android. It only serves the JavaScript.

1. Once: build `dev-apk` on GitHub, download it and install it on your phone.
2. On your computer: `npm install`, then `npm start`.
3. Connect the phone:
   - USB: run `adb reverse tcp:8081 tcp:8081`, then open the app.
   - Wi-Fi (same network): open the app, shake the phone, Settings > Debug server host, enter `YOUR-COMPUTER-IP:8081`, then reload.
4. Edit code. The app updates in about a second (Fast Refresh).

Build a new `dev-apk` only when `android/` or a native package changes. Changes in `src/` and `content/` never need one.

## Settings to fill in

Repository secrets (GitHub: Settings > Secrets and variables > Actions):

| Secret | What it does |
|---|---|
| `APPLOVIN_SDK_KEY`, `APPLOVIN_NATIVE_AD_UNIT_ID` | Real ads. Without them the app shows sample ads. |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Remote settings and the admin screen. Without them the app uses the values in `src/config/app.ts`. |

Use the Supabase **anon** (public) key only. Never the `service_role` key.

## Admin and remote settings

The admin can switch ads on or off and change public settings (help website, contact email, WhatsApp, Pro activation, Lemon Squeezy ids) for every user, without a new app version.

Setup, once:

1. Create a project at supabase.com.
2. SQL Editor: paste `supabase/setup.sql` and run it.
3. Authentication > Users > Add user: create your admin account (email and password).
4. SQL Editor: run the last line of `supabase/setup.sql` with your admin email.
5. Authentication > Sign In / Providers: turn off "Allow new users to sign up".
6. Add the `SUPABASE_URL` and `SUPABASE_ANON_KEY` secrets and rebuild the app.

Use it: open Profile, tap the version line at the bottom 7 times, sign in, change a setting, press Save. Users get the change the next time they open the app.

Only public values go in these settings. API secrets (Lemon Squeezy API key, Supabase `service_role` key) must never be in the app or in the `app_config` table.

Rules for contributors (and for Claude) are in `CLAUDE.md`.
