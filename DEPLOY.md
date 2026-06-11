# ROAMR — Deploy the backend (rules + Cloud Functions)

The app code is on GitHub. The **Cloud Functions** (counters, rate-limiting, push) and the
**current hardened security rules** still need to be deployed once. This requires the Firebase
CLI (Node-based). Run it from any machine with Node 20+ — e.g. the co-founder's dev machine.
Project is already on the **Blaze** plan, so Functions will deploy.

## One-time setup
```bash
npm install -g firebase-tools      # no admin needed
firebase login                     # opens browser; log in as the project owner
```

## Deploy (run from the repo root)
```bash
# 1) install deps (app + functions)
npm ci
npm --prefix functions install

# 2) sanity-check the security rules BEFORE shipping them
npm run test:rules                 # Firestore emulator; must pass

# 3) deploy rules, indexes, and functions together
firebase deploy --only firestore:rules,storage,firestore:indexes,functions
```

If `firebase deploy` asks which project: choose **roamr-55afb** (or run
`firebase use roamr-55afb` first).

## Verify after deploy
- Firebase console → Build → Functions: you should see onPostCreate, onFollowCreate,
  the counter triggers, and the rate-limit triggers (onPostCreate/onActivityCreate/etc.) listed.
- Firestore → Rules: the published rules should include the `private` subcollection match and
  the `rateLimits` / `abuseFlags` deny blocks.
- Create a test post in the app → its likeCount/commentCount should be maintained by the
  function, and PII (email/phone/tokens) should live under `users/{uid}/private/data`.

## Then (separate, after deploy)
- **App Check**: register reCAPTCHA v3, put the site key in `VITE_RECAPTCHA_SITE_KEY`,
  redeploy the web app, then turn on enforcement for Firestore/Storage in the console.
- Host the legal pages, set the Sentry DSN, add monitoring/uptime alerts (see GO-LIVE.md).

> Backups (PITR + daily) and the $25 budget alert are already enabled in the console.
