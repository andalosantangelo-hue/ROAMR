# ROAMR — Push notifications (BACKEND-PLAN §9.B)

First server-side code in the project. Client + Functions are scaffolded; the
steps below are the infra only you can do.

## What's built
- **Cloud Functions** (`functions/index.js`) — Firestore triggers that send FCM:
  post like → kudos, post/activity comment, activity join, tribe join, new
  follower. Each skips self-notify, checks the recipient's `notificationPrefs`,
  multicasts to their `fcmTokens`, and prunes dead tokens.
- **Client** (`src/lib/push.js`) — `registerPush(uid)` asks permission (native
  only), registers, and stores the device token in `users/{uid}.fcmTokens`
  (`arrayUnion`).
- **Settings → Notifications** — per-type toggles write
  `users/{uid}.notificationPrefs`; "Enable push on this device" calls
  `registerPush`. (On web it shows "works in the mobile app".)

## User-doc fields used
```
users/{uid}
  fcmTokens: array<string>        // device tokens (arrayUnion / pruned on send)
  notificationPrefs: {            // all default true
    kudos, comments, activityJoin, tribeMember, newFollower : bool
  }
```

## Infra steps (YOU)
1. **Upgrade to Blaze** — Cloud Functions require the pay-as-you-go plan
   (free tier is generous; you set a budget alert). Firebase console → Upgrade.
2. **Install Firebase CLI** (once): `npm i -g firebase-tools` then `firebase login`.
3. **Install function deps + deploy:**
   ```bash
   cd functions && npm install && cd ..
   firebase deploy --only functions      # project roamr-55afb (.firebaserc)
   ```
4. **iOS APNs** — in Apple Developer, create an APNs Auth Key (.p8) and upload it
   in Firebase console → Project settings → Cloud Messaging → Apple app config.
   In Xcode (after `npx cap add ios`): enable **Push Notifications** capability +
   **Background Modes → Remote notifications**.
5. **Android** — FCM works out of the box once `google-services.json` is in the
   Android project (Firebase console → add Android app → download it into
   `android/app/`). The Capacitor push plugin handles registration.

## Permission priming (§9.B note)
We ask for notification permission **after** a deliberate tap ("Enable push on
this device" in Settings), not on first launch — better grant rates and a calmer
first run.

## Later (Cloud Functions you can add in the same env)
Robust account-deletion fan-out (§9.A.1) and report auto-actioning (§9.A.3) now
have a home — add them as callable/trigger functions alongside these.
