# ROAMR — Start Here, Christian 👋

Welcome aboard! Andalo (with Claude's help) has already built the entire ROAMR app
and backend. **Almost everything is done.** Your main job is one thing: **push the
backend live** with a single deploy. Then there are a few smaller launch steps.

This guide spells out every step. Go one part at a time — you can't break anything
(the database has backups + a 7-day undo, so it's safe to experiment).

---

## The picture (what's already done)
- The whole app (React + Vite) and backend (Firebase: Auth, Firestore, Storage, Cloud Functions) is written and on GitHub.
- Security is hardened: locked-down database rules, personal info kept private, server-side anti-spam / rate-limiting, account deletion, etc.
- Firebase is already on the paid **Blaze** plan, with **daily backups** and a **$25 budget alert** turned on.
- Tests + CI are set up.

## What you'll do (≈30–45 min)
1. Get the code
2. Install two tools
3. Log in to Firebase as Andalo
4. Run the deploy (4 commands)
5. Verify it worked
…then a short list of remaining launch steps.

---

## Part 1 — Get the code
**Repo:** https://github.com/andalosantangelo-hue/ROAMR

Easiest (GitHub Desktop):
1. Download & install GitHub Desktop: https://desktop.github.com
2. Open it → **File → Clone repository → URL** tab → paste
   `https://github.com/andalosantangelo-hue/ROAMR.git` → pick a folder → **Clone**.
3. If it asks you to sign in, use **Andalo's GitHub login**.

(Comfortable with a terminal instead? `git clone https://github.com/andalosantangelo-hue/ROAMR.git`)

## Part 2 — Install two tools (one time)
1. **Node.js 20+** — go to https://nodejs.org, download the **LTS** version, install (just click through).
2. **Firebase CLI** — open a terminal (Mac: *Terminal*; Windows: *PowerShell*) and run:
   ```
   npm install -g firebase-tools
   ```
   (Mac: if it says "permission denied", put `sudo ` in front.)
3. Confirm it worked: `firebase --version` should print a number.

## Part 3 — Log in to Firebase as Andalo
The project lives in Andalo's Google account, so the deploy must log in as him.
1. Run: `firebase login`
2. A browser opens → sign in with **Andalo's Google account** (he'll share the email + password).
3. Approve access. You should see "Success! Logged in as …@gmail.com".

## Part 4 — Deploy (the main event)
In the terminal, go into the folder you cloned, then run these **in order**:
```
cd ROAMR                         # the folder you cloned into
npm ci
npm --prefix functions install
npm run test:rules               # safety check — wait for it to pass
firebase deploy --only firestore:rules,storage,firestore:indexes,functions
```
Notes:
- `npm run test:rules` runs a quick security-rules check. If it complains it needs **Java**,
  install Java (https://adoptium.net) and re-run — or, if you're in a hurry, you can skip
  that one line and go straight to the deploy (running it is just safer).
- If the deploy asks **which project**, choose **roamr-55afb**.
- It takes a few minutes. When it ends with **"Deploy complete!"** — you're done. 🎉

## Part 5 — Verify
Open the Firebase console (https://console.firebase.google.com → **ROAMR**, signed in as Andalo):
- **Build → Functions**: you should see a list (onPostCreate, onFollowCreate, the counter + rate-limit triggers).
- **Firestore Database → Rules**: the rules should mention `private` and `rateLimits`.

That's the backend live and secure.

---

## After the deploy — remaining launch steps (in order)
Smaller items. Full detail is in **GO-LIVE.md** in the repo. Rough order:
1. **App Check** (blocks bots/abuse) — in the console, create a reCAPTCHA v3 key, put it in
   the app `.env` as `VITE_RECAPTCHA_SITE_KEY`, redeploy the web app, then turn on
   enforcement for Firestore + Storage.
2. **Host the legal pages** — privacy/terms/accessibility are in the repo under `legal/`.
   Deploy hosting and point the public links at them.
3. **Sentry** (error alerts) — create a free Sentry project, paste its DSN into `.env` as `VITE_SENTRY_DSN`.
4. **Monitoring** — in Google Cloud, add an alert for function errors + an uptime check.
5. **App Store / Play** — developer accounts, app icon, privacy labels (see `CAPACITOR-SETUP.md` and `SHIP-BLOCKERS.md`).

---

## Using Claude to help (you're signed in with Andalo's account)
You're on your own computer running Claude Desktop, logged in with **Andalo's** account —
so the same connectors and skills are available to you:
- If a connector (GitHub, Google Drive, Gmail) shows **disconnected**, open
  **Settings → Connectors** and reconnect, signing in with **Andalo's** credentials when asked.
- The actual deploy runs in **your terminal** (Part 4) — Claude can't press enter for you,
  but if anything errors, paste the exact message to Claude and it'll walk you through the fix.
- Everything is in the GitHub repo, so once you've cloned it, Claude on your machine can read
  and edit the same files.

## If you get stuck
- Re-run the command that failed and copy the **exact** error to Claude or Andalo.
- Remember: backups + 7-day point-in-time recovery are on, so nothing you do here is permanent.

You've got this. 🚀
