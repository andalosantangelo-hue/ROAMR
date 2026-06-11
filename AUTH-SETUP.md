# ROAMR — Auth (BACKEND-PLAN §6 step 1) — what's wired & what you must enable

Implements BACKEND-PLAN §4: AuthProvider, RequireAuth guards, create/merge
`users/{uid}` on first sign-in. All four providers — **Email/Password, Google,
Apple, and Phone (SMS)** — are wired on the Login screen. Onboarding persists
`interests`, Profile shows the real signed-in user with Sign out, and new tribes
stamp `ownerId`.

## Enable sign-in providers (Firebase console → Authentication → Sign-in method)
Required for the buttons to work:
- **Email/Password**  ← needed for the email flow + password reset
- **Google**          ← one-tap, works on web immediately
- **Apple**           ← needed for App Store; works on web via popup
- **Phone**           ← SMS one-time-code flow (now wired — see below)

> Until a provider is enabled you'll see "this sign-in method isn't enabled yet."

## How the flow works now
- Splash → **Login**. Enter email → Continue: if the email exists you get a
  password prompt (Sign in); if not, you create a password (sign up). Google/Apple
  are one tap. "Forgot password?" sends a reset email.
- **Continue with phone** → enter a number in international format
  (e.g. `+14155552671`) → we send a 6-digit SMS code → enter it to sign in.
- On first sign-in, `users/{uid}` is created (interests:[], subscription basic,
  counters). Returning users merge (interests/profile never clobbered).
- New user → **Onboarding** (interests saved to `users/{uid}.interests`) → Home.
  Returning user → straight to Home.
- `/app/*` and `/create-tribe` are guarded by **RequireAuth** — no session bounces
  to /login. Profile → **Sign out** (BACKEND-PLAN §9.A.2 blocker, done).

## Phone (SMS) — what's wired and what you must configure
The **web** flow is fully wired in `AuthContext.startPhoneSignIn` /
`confirmPhoneCode` and the Login screen (phone → OTP steps). It uses Firebase's
**invisible reCAPTCHA** (rendered into `#recaptcha-container` on the Login screen)
plus `signInWithPhoneNumber`.

Console / project setup you must do yourself:
1. **Enable the Phone provider** (Authentication → Sign-in method → Phone).
2. **Authorized domains** — add the domains you'll serve from (Authentication →
   Settings → Authorized domains). `localhost` is allowed by default for dev.
3. **reCAPTCHA / App Check** — phone auth is protected by reCAPTCHA. For local dev
   you can add **test phone numbers** (Authentication → Sign-in method → Phone →
   "Phone numbers for testing") so no real SMS is sent and the reCAPTCHA is
   bypassed — the fastest way to test the full flow here.
4. **SMS region policy & quota** — for production, review Authentication →
   Settings → SMS region policy (allow/deny by country) to avoid SMS-pumping
   abuse, and be aware of the free daily SMS quota.

> **Native (Capacitor) follow-up — not testable in this environment.** On iOS/
> Android the web reCAPTCHA + `signInWithPhoneNumber` path does not apply: native
> phone auth needs silent APNs push (iOS) or Play Integrity / SafetyNet (Android)
> and a native plugin (e.g. `@capacitor-firebase/authentication` with
> `signInWithPhoneNumber`, or `@react-native-firebase`-style flow). When you wrap
> the native builds, swap the verifier for the plugin's native flow and upload the
> APNs auth key to Firebase. Flagged here rather than faked — the web flow above is
> real and works in the browser build.

## Security rules — already in the repo
`firestore.rules` and `storage.rules` at the app root already encode the
auth-gated baseline (BACKEND-PLAN §5) for `users` and every collection now wired,
plus `reports`/`blocked`. Deploy with `firebase deploy --only firestore:rules` /
`firebase deploy --only storage` once you've tested sign-in. `firestore.indexes.json`
holds the collection-group index for the `members.uid` membership query.

> The `users` rules block client writes to `followerCount` / `followingCount` /
> `subscription` / `createdAt` — those are server-maintained (Cloud Functions /
> console). Until you deploy rules you remain in test mode, so it all works now.

## Next per BACKEND-PLAN §6
Step 1 (Auth + `users`) ✅ — including Phone. Step 2 (Onboarding interests) ✅.
Step 3 = Edit Profile write + avatar upload + Premium reads subscription.
Step 4 = retrofit Tribes membership (members subcollection, persist Join/Leave,
derive memberCount).

---

## Step 4 notes — Tribes membership

Join/Leave writes `tribes/{id}/members/{uid}` (presence) with optimistic UI,
bumps `memberCount`, and the owner is auto-joined on create. The signed-in user's
joined set comes from a **collection-group** query on `members`.

Two console things this introduces:

1. **Composite index prompt.** The first time the membership query runs, Firestore
   may log an error with a one-click link: *"The query requires an index."* Click
   it to auto-create the single-field collection-group index on `members.uid`.
   (It's also captured in `firestore.indexes.json`.)

2. **Rules for the collection-group read.** The nested `members` match isn't enough
   for a collection-group query — the top-level `match /{path=**}/members/{uid}`
   block in `firestore.rules` covers it (member doc id == the user's uid, so it's
   safe).
