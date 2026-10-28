# ROAMR — Progress / session handoff

Keep this short. Overwrite stale sections instead of appending history (git log has history).
Last updated: 2026-10-28, after merging #62 (Alpha edits), #63 (these docs), #64 (CI fix). CI is green on `main`. Deployed to roamr-55afb on 2026-10-28 (rules, indexes, storage, 28 functions incl. new `shopCatalog`, hosting).

> ⚠️ If a local session (Windows/OneDrive) has uncommitted work, push it and update this file.

## Built (in code)
- Auth: email/password, Google + Apple (web popup and native via `@capacitor-firebase/authentication`), password reset, email verification, 18+ age gate, show/hide password.
- Onboarding: display name, activities + subcategories + skill level, home base, availability, profile prompt.
- Core tabs: Home feed (posts), Activities, Tribes (detail + member group chat), Marketplace (categories + ROAMR Apparel tab), Profile (Hinge-style: photo grid, prompts, vitals, completeness meter).
- Social: likes, comments, follows, joins, search, notifications inbox + push, DMs, invite/share links.
- Safety: safety center, verify, emergency info, safety controls, waiver, trip plans + overdue-trip cron, reviews/references.
- Trust & security: report/block (enforced in feeds, DMs, group chat), hardened Firestore/Storage rules, PII in private subcollection, server-side counters + rate limits, CSP/security headers, consent banner, account deletion.
- Help Center, on-device Help Bot, Guides, About, in-app legal pages (`/legal/:doc`).
- Alpha edits (#62): email-verify card in Notifications + Profile row; single location field with GPS/recents/Photon search, activities store `{lat,lng}`; Activities List/Map (Leaflet) + 10–100 mi radius; notifications show actor name/photo + follow back; ROAMR Apparel reads live Shopify catalog via `shopCatalog` function (snapshot fallback) with bag + cart-permalink checkout; rich posts (2,200-char story, up to 10 media: 4K photo, 360°, video ≤5 min, audio, resumable uploads); fix for empty feeds after login.
- Tests (vitest + rules tests) and CI (lint, test, coverage gate, build, audit, gitleaks).

## Open — needs code
- [ ] **URGENT:** Cloud Functions Node.js 20 runtime is decommissioned 2026-10-30 — after that, functions can't be redeployed. Move `functions/package.json` + `firebase.json` to Node 22 and upgrade `firebase-functions` (breaking changes), test with emulator, redeploy.
- [ ] Before real traffic (from #62): paid map tiles + geocoder instead of OSM/Photon, video transcoding (also strips GPS metadata), geohash queries for the map.
- [ ] Firestore field-validation rules + move `fcmTokens`/`notificationPrefs` to private subcollection — verify with `npm run test:rules` first (CHECKLIST-STATUS.md).
- [ ] Account-deletion fan-out as a Cloud Function (other users' presence docs, Storage cleanup) — client-side only today.
- [ ] Bug list in ROAMR-BACKLOG.md is empty; run its test pass on a real device and log findings.
- [ ] README.md screen checklist is stale (all screens exist) — fix or delete.

## Open — needs accounts/console (not code)
- [x] Deploy rules + indexes, then hosting → https://roamr-55afb.web.app (2026-10-28)
- [ ] Enable Google + Apple providers; Apple Services ID (docs/NATIVE-AUTH-SETUP.md)
- [ ] App Check enforcement + `VITE_RECAPTCHA_SITE_KEY`; Sentry project + `VITE_SENTRY_DSN`
- [ ] Monitoring alerts + uptime check; one backup restore drill
- [ ] Staging Firebase project; branch protection on `main`
- [ ] App Store / Play: Info.plist usage strings, icon via `@capacitor/assets`, privacy labels
- [ ] Confirm Premium is display-only at launch (no payment processor)

## Next up (pick from here)
1. Node 22 functions upgrade (see URGENT above).
2. Device test pass on the live link (posting with video, map, apparel checkout) → log bugs in ROAMR-BACKLOG.md.
3. Close or merge the ~45 stale remote branches so sessions stop tripping over old versions.

## Decisions worth remembering
- Deploys: Actions → Deploy workflow (needs `FIREBASE_SERVICE_ACCOUNT` secret to be valid key JSON; first attempt failed on a bad paste) or `firebase deploy` from a logged-in machine.
- Firebase only, no custom server (docs/adr/0002).
- Rate limits fail open, so a bug can't lock out real users.
- Coverage gate is scoped to the unit-testable core only; `image.js` is excluded because it's canvas code.
