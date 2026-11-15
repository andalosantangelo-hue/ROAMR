# ROAMR — Progress / session handoff

Keep this short. Overwrite stale sections instead of appending history (git log has history).
Last updated: 2026-11-08. Live on roamr-55afb: everything through #66 + #88 (`/welcome`, empty states); all 28 functions on Node 22; Deploy workflow works (service-account secret + IAM roles fixed 2026-11-05). CI: #90 bumped firebase-tools to 15.35 (Firestore emulator 1.22.0, fixes the tribe-chat e2e failure); #91 (counter audit waits for triggers to settle) pending merge.

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
- Verified Guides (this branch): `/guide/apply` application (private `guideApplications/{uid}`, always submitted as pending), admin approves in the console → `onGuideApplicationWrite` sets the public `users/{uid}.guide` badge + notifies. How to review: `docs/GUIDE-APPROVALS.md`.
- Tests (vitest + rules tests) and CI (lint, test, coverage gate, build, audit, gitleaks).
- #66: per-field type/size validation in rules, server-side account deletion (`deleteAccount` callable), idempotent counters, daily notification dedupe, beta-run bug fixes, skeleton loading, offline posting, synthetic-user e2e + rules job in CI. Post media URLs are checked by the renderer + `onPostCreate`, not rules (rules expression limit).

## Open — needs code
- [ ] Before real traffic (from #62): paid map tiles + geocoder instead of OSM/Photon, video transcoding (also strips GPS metadata), geohash queries for the map.
- [ ] Move `fcmTokens`/`notificationPrefs` to private subcollection (field validation + server-side deletion are done in #66).
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
1. **Guides (business priority):** recruit 3 independent guides (start with fly fishing). Run their first trips by hand: they set the price, take payment via a Stripe Payment Link, ROAMR keeps a small cut and pays them out; list the trip as an activity. Measure whether clients pay through ROAMR and come back.
2. **Before ROAMR takes any cut:** one hour with a lawyer who knows outdoor recreation. Some states may treat ROAMR as booking agent/outfitter once it takes money for guided trips.
3. Next code after Verified Guides: "paid trip" activity type for approved guides (price + "Book with <guide>" link, no in-app payments yet). In-app payments + commission (Stripe Connect) only once hand-run trips work.
4. Tribe organizer "Pro" tools (recurring events, roles, private tribes, attendance stats) — later, a subscription; keep joining/creating tribes free. Never paywall safety features.
5. Device test pass on the live link → log bugs in ROAMR-BACKLOG.md. Close the ~45 stale remote branches.

## Decisions worth remembering
- Deploys: Actions → Deploy workflow (needs `FIREBASE_SERVICE_ACCOUNT` secret to be valid key JSON; first attempt failed on a bad paste) or `firebase deploy` from a logged-in machine.
- Firebase only, no custom server (docs/adr/0002).
- Rate limits fail open, so a bug can't lock out real users.
- Coverage gate is scoped to the unit-testable core only; `image.js` is excluded because it's canvas code.
