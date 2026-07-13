# Native Social Auth Setup (Google + Apple) — Android & iOS

Google/Apple sign-in works on **web** via the Firebase JS SDK popup. In the
**native** Capacitor apps that popup doesn't work, so we use the
[`@capacitor-firebase/authentication`](https://capawesome.io/plugins/firebase/authentication/)
plugin for the native account picker and bridge the returned credential into the
Firebase **JS SDK**, which stays the session owner for the whole app.

## What's already in the repo (done in code)

- `@capacitor-firebase/authentication` added to `package.json`.
- `capacitor.config.json` → `plugins.FirebaseAuthentication`: `skipNativeAuth: true`,
  `providers: ["google.com", "apple.com"]`. `skipNativeAuth: true` is what makes the
  JS SDK (not the native SDK) hold the session.
- `src/store/AuthContext.jsx` → `googleSignIn` / `appleSignIn` branch on
  `Capacitor.isNativePlatform()`: native calls `FirebaseAuthentication.signInWith*()`
  then `signInWithCredential(auth, …)`; web keeps `signInWithPopup`.

**Status:** the native path is written to the plugin's documented pattern but is
**untested on a device**. It cannot be validated until the platform config below
is in place. Web is verified and unaffected.

## The `android/` and `ios/` folders are gitignored

Native projects are **regenerated**, not committed. On any machine:

```
npm install
npm run build
npx cap add android      # and/or: npx cap add ios   (ios requires macOS)
npx cap sync
```

Because they're regenerated, native-side edits (Gradle, Info.plist, AppDelegate)
must be re-applied after a fresh `cap add`. Keep them documented here.

---

## Android (owner: Andalo — Windows OK)

Reference: https://capawesome.io/plugins/firebase/authentication/ → "Google" setup.

1. **Register the Android app in Firebase.** Console → project `roamr-55afb` →
   Project settings → Your apps → Add app → Android → package name
   **`com.roamr.app`** (must match `capacitor.config.json` `appId`).
2. **Download `google-services.json`** and place it at **`android/app/google-services.json`**.
3. **Add your SHA-1 (and SHA-256) fingerprint** to that Android app in Firebase —
   **Google sign-in fails without it.** Generate it with:
   ```
   cd android
   ./gradlew signingReport
   ```
   Copy the debug `SHA1` (and `SHA-256`) into Firebase → Android app → Add fingerprint.
   Add the release keystore's fingerprints too before shipping.
4. **Apply the Google Services Gradle plugin** (Capacitor doesn't do this for you):
   - `android/build.gradle` → `dependencies { classpath 'com.google.gms:google-services:4.4.2' }`
   - `android/app/build.gradle` → add at the bottom: `apply plugin: 'com.google.gms.google-services'`
   - Confirm the plugin's required `firebase-auth` version — check the plugin's
     official [Google setup doc](https://github.com/capawesome-team/capacitor-firebase/blob/main/packages/authentication/docs/setup-google.md)
     in case it wants a specific version pinned in `android/variables.gradle`.
5. **Google provider** is already enabled in Firebase (web sign-in proves it).
6. **Build & test:** open `android/` in Android Studio (or `npx cap run android`),
   run on an emulator/device, tap **Continue with Google**. Confirm you land in the
   app signed in. If it errors, capture the logcat line.

---

## iOS (owner: partner — macOS + Xcode required)

References: plugin "Apple" and iOS setup docs, linked below.

1. **Generate the iOS project on the Mac:** `npx cap add ios` then open
   `ios/App/App.xcworkspace` in Xcode.
2. **Register the iOS app in Firebase.** Console → `roamr-55afb` → Add app → iOS →
   bundle ID **`com.roamr.app`** → download **`GoogleService-Info.plist`** → drag it
   into the Xcode **App** target (check "Copy items if needed").
3. **Google — URL scheme:** in `GoogleService-Info.plist` find `REVERSED_CLIENT_ID`,
   then in Xcode → App target → Info → URL Types → add a URL scheme with that value.
4. **AppDelegate proxy:** ensure `ios/App/App/AppDelegate.swift` implements
   `application(_:open:options:)` and returns `ApplicationDelegateProxy.shared.application(...)`
   — required for the OAuth redirect to return to the app. See the plugin's
   [installation docs](https://capawesome.io/plugins/firebase/authentication/) for the exact snippet.
5. **Sign in with Apple:**
   - Xcode → App target → Signing & Capabilities → **+ Capability → Sign in with Apple**.
   - Apple Developer (paid membership): App ID with **Sign in with Apple** enabled;
     create a **Services ID** and a **Sign in with Apple key** (.p8).
   - Firebase Console → Authentication → Sign-in method → **Apple** → enable and fill
     the Services ID, Apple Team ID, Key ID, and the private key (needed for the
     web/Android Apple flow and to complete config).
6. **Build on a device** (Apple sign-in doesn't work in the simulator for some flows)
   and test both **Continue with Apple** and **Continue with Google**.

---

## Notes

- The exact Gradle versions, `variables.gradle` keys, and the AppDelegate snippet
  can change between plugin releases. Confirm against the plugin's official setup
  docs (linked above) rather than trusting these versions blindly — they were not
  fully fetchable when this file was written.
- Apple provider config is also what makes **Apple sign-in on web** work end-to-end;
  right now only Google is verified on web.
