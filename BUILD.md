# Building and running Hookd

**Rule: APKs are built only in GitHub Actions.** Never build one on the computer:
no `npm run android`, no `react-native run-android`, no `./gradlew assemble...`.
A local build takes many minutes and gives a differently signed app.

## 1. Build the APK (GitHub Actions)

Only when the owner asks for a build.

1. Push the branch.
2. GitHub > Actions > **Android** > **Run workflow**, pick the branch and what to build:
   - `dev-apk`: debug app that loads JavaScript from Metro on the computer. Use this for daily work.
   - `test-apk`: standalone app with the JavaScript inside, signed with the debug key.
3. Or from the terminal: `gh workflow run android.yml --ref <branch> -f build=dev-apk`
4. When the run is green, download the artifact `hookd-dev-apk` or `hookd-test-apk`:
   `gh run download <run-id> -n hookd-dev-apk -D <folder>`

A new APK is needed only when native things change: anything in `android/`, a package
added, removed or upgraded, or the keys written by `scripts/write-env.ts`.
A change in `src/` or `content/` does **not** need a new APK: Metro sends it to the dev app.

## 2. Install it on the phone (wireless debugging)

1. Phone: Developer options > Wireless debugging > on. Same Wi-Fi as the computer.
2. `adb devices` should list the phone as `device`. If it says `offline` or is missing:
   `adb mdns services`, then `adb connect <ip>:<port>`.
   First time only: `adb pair <ip>:<pairing-port>` with the code shown on the phone.
3. `adb install -r <folder>/<file>.apk`

## 3. Run the app (no build)

With the `dev-apk` already installed:

1. `npm start` (Metro; leave it running)
2. `adb reverse tcp:8081 tcp:8081`
3. `adb shell monkey -p com.hookd.app 1` (opens the app)

Shake the phone or press `r` in the Metro terminal to reload.
