# ROAMR — Progress / session handoff

Keep this short. Overwrite stale sections instead of appending history (git log has history).
Last updated: 2026-10-29. `main` has #62–#65 and #84 (Deploy workflow). **#66 (beta hardening) is open, merged up with `main`, awaiting review — then it needs its own deploy (below).**

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
- In #66 (not on `main` yet): per-field type/size validation in rules, server-side account deletion (`deleteAccount` callable), idempotent counters, daily notification dedupe, beta-run bug fixes, skeleton loading, offline posting, synthetic-user e2e + rules job in CI. Post media URLs are checked by the renderer + `onPostCreate`, not rules (rules expression limit).

## Open — needs code
- [ ] Before real traffic (from #62): paid map tiles + geocoder instead of OSM/Photon, video transcoding (also strips GPS metadata), geohash queries for the map.
- [ ] Move `fcmTokens`/`notificationPrefs` to private subcollection (field validation + server-side deletion are done in #66).
- [ ] Bug list in ROAMR-BACKLOG.md is empty; run its test pass on a real device and log findings.
- [ ] README.md screen checklist is stale (all screens exist) — fix or delete.

## Open — needs accounts/console (not code)
- [ ] Deploy rules + indexes, then hosting → https://roamr-55afb.web.app
- [ ] Enable Google + Apple providers; Apple Services ID (docs/NATIVE-AUTH-SETUP.md)
- [ ] App Check enforcement + `VITE_RECAPTCHA_SITE_KEY`; Sentry project + `VITE_SENTRY_DSN`
- [ ] Monitoring alerts + uptime check; one backup restore drill
- [ ] Staging Firebase project; branch protection on `main`
- [ ] App Store / Play: Info.plist usage strings, icon via `@capacitor/assets`, privacy labels
- [ ] Confirm Premium is display-only at launch (no payment processor)

## Deploying #66 (its own deploy — do it right after merging)
1. Merge #66. Actions → **Deploy** → `all`. Backend (rules, indexes, storage, functions) goes before hosting on purpose: the new client calls `deleteAccount` and writes fields only the new rules accept.
2. Check the run's **Firestore TTL policies** step. It's allowed to fail (service account may lack `roles/datastore.owner`); if it did, run once:
   `gcloud firestore fields ttls update expireAt --collection-group=processedEvents --enable-ttl --project=roamr-55afb` and the same for `notifDedupe`. Without TTL nothing breaks; those collections just grow.
3. Functions runtime moves Node 20 → 22 (`functions/package.json`). If deploy refuses, that's the cause.
4. Smoke test on https://roamr-55afb.web.app: sign up, post with photo + video, like/unlike twice (one notification only), delete a test account (Settings → Delete).
5. Risk: rules now validate the *whole* doc on update. Any existing test doc with an out-of-range field (e.g. 50-char display name) can't be edited until fixed in the console. Fine pre-launch; check if real users exist.

## Next up (pick from here)
1. Review + merge #66, then deploy it (above).
2. Device test pass on the live link (posting with video, map, apparel checkout) → log bugs in ROAMR-BACKLOG.md.
3. Close or merge the ~45 stale remote branches so sessions stop tripping over old versions.

## Decisions worth remembering
- Firebase only, no custom server (docs/adr/0002).
- Rate limits fail open, so a bug can't lock out real users.
- Coverage gate is scoped to the unit-testable core only; `image.js` is excluded because it's canvas code.
