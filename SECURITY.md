# ROAMR — Security overview

Owner: founders (Andalo + co-founder). Report issues privately to the team email
before public disclosure.

## Model
- **Backend:** Firebase (Firestore, Storage, Auth, Cloud Functions) — project `roamr-55afb`.
- **Trust boundary:** the **security rules** (`firestore.rules`, `storage.rules`) are the
  real authorization layer. Client route guards (`RequireAuth`) are UX only.

## What's enforced
- Auth required for all app reads; writes are owner-checked (`authorId`/`ownerId`/
  `sellerId`/`reporterId` must equal `request.auth.uid`).
- Denormalized counters (likes, members, attendees, comments, follows) are written
  **only by Cloud Functions** (admin) — clients cannot inflate them.
- Storage: uploads are owner-namespaced, images only (no SVG), < 10 MB.
- `reports` is create-only (no client read); triaged in the Firebase console.
- Account deletion fans out the user's content + presence docs (`AuthContext.deleteAccount`).
- Report + block + client-side feed filtering for blocked users.

## Secrets
- The Firebase **web config** (in `src/lib/firebase.js`) is public by design — safe to commit.
- **Never** commit a Firebase service-account / admin key. `.gitignore` blocks the common
  patterns; CI runs gitleaks on every push/PR.
- Optional integrations use env vars (`.env.example`): `VITE_SENTRY_DSN`, `VITE_RECAPTCHA_SITE_KEY`.

## Hardening still recommended (tracked, not yet done)
- Firestore **field-validation rules** (type/size + `keys().hasOnly([...])` on create) —
  must be added with the emulator rules-test suite (`npm run test:rules`) so they don't
  block legitimate writes.
- **App Check** — set `VITE_RECAPTCHA_SITE_KEY` + enable enforcement in the console
  (covers rate-limiting / bot / abuse).
- Move `fcmTokens` / `notificationPrefs` to an owner-only private subcollection so other
  signed-in users can't read them.
- Staging Firebase project separate from production.

## Headers
Firebase Hosting serves CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy,
Permissions-Policy (see `firebase.json` → hosting.headers). HSTS is automatic on Hosting.
