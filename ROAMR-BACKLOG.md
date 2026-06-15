# ROAMR — Backlog: bugs, fixes & changes

A running list for everything we want to do to the app. Add freely as you test.
Keep it simple — one line per item. Both Andalo and Christian edit this.

**Type:** 🐞 Bug · 🔧 Fix · ✏️ Change (UX/design/copy) · ✨ Feature
**Priority:** P1 = before launch · P2 = soon after · P3 = nice-to-have
Mark done by changing `[ ]` to `[x]`.

> How to find bugs fast: open the live app (roamr-55afb.web.app once hosting is deployed)
> on your phone, go screen by screen, and try to break things. Note what you see here.

---

## 🐞 Bugs found while testing
_(add as you go — id, what happened, where)_

- [ ] _(none logged yet — start here)_

| # | What's wrong | Where (screen) | Priority | Notes |
|---|---|---|---|---|
| 1 |  |  |  |  |
| 2 |  |  |  |  |
| 3 |  |  |  |  |

---

## ✅ Test pass — tap through these and check each works
_(checking these off will surface most bugs)_

- [ ] Sign up with email → set display name in onboarding → first post shows your real name
- [ ] Sign in with Google
- [ ] Sign in with Apple (needs native config — may fail until set up)
- [ ] Create a post with a photo → it uploads and appears
- [ ] Create an activity, a tribe, a marketplace listing
- [ ] Like / comment / follow / join → the counts update correctly
- [ ] Notifications inbox shows new activity; bell badge counts
- [ ] Push notification arrives on a real device
- [ ] Invite / share link opens the right screen
- [ ] Search returns sensible results
- [ ] Edit profile + photo saves
- [ ] Block / report a user or post works
- [ ] Delete account removes your data
- [ ] Go offline, do something, come back online → it syncs
- [ ] Normal use never hits a rate-limit / nothing disappears

---

## 🚀 Launch must-dos (P1 — before sharing publicly)
_(mostly account/ops — see GO-LIVE.md)_

- [ ] **Deploy hosting** so there's a public URL — Christian: `npm run build && firebase deploy --only hosting`
- [ ] Push the 2 pending UI tweaks (brighter green bottom-nav labels) to GitHub
- [ ] Host the legal pages and point /privacy and /terms at them
- [ ] Enable **App Check** enforcement + set the reCAPTCHA key (VITE_RECAPTCHA_SITE_KEY)
- [ ] Create a **Sentry** project → set VITE_SENTRY_DSN → redeploy (error alerts)
- [ ] **Monitoring**: GCP alert on function errors + an uptime check
- [ ] **Backups**: do one restore drill (PITR + daily backups already on)
- [ ] Native **status-bar cleanup** for the iOS/Android build (see CAPACITOR-SETUP.md)

## 🟡 Soon after launch (P2)
- [ ] Separate **staging** Firebase project from production
- [ ] **Branch protection** on GitHub once you adopt a PR workflow (note: blocks direct pushes)
- [ ] App Store / Play setup: developer accounts, app icon, Info.plist usage strings, privacy labels
- [ ] Confirm the new green CTA / button color looks right on every screen on a real device

---

## ✏️ Design / UX changes you want
_(brain-dump here as you look at it — colors, spacing, copy, icons, flows)_

- [ ]
- [ ]
- [ ]

## ✨ Feature ideas (P3 / later)
_(things to build once the basics are solid)_

- [ ]
- [ ]
- [ ]

---

## Already done (so we don't re-add it)
Auth + onboarding (with name step), Home/Activities/Tribes/Marketplace/Profile, posts/activities/
comments/likes/follows/tribes/listings/search, notifications + push, offline sync, account deletion,
report/block, age gate, consent banner, legal pages drafted. Security: hardened Firestore/Storage
rules (live), PII in a private subcollection, server-side counters + rate-limiting (live), image
compression. Tests + CI. Backups + budget alert on. 5-tab nav, accessible greens, brighter nav labels.
