# ROAMR — Progress / session handoff

Keep this short. Overwrite stale sections instead of appending history (git log has history).
Last updated: 2026-10-28, from the GitHub `main` state (last code commit 2026-07-12).

> ⚠️ Local work on the Windows machine (OneDrive folder, "Roamer app QA and feature" session)
> may not be pushed yet. Before relying on this file, run `git status` there, commit and push,
> then update the sections below.

## Built (in code)
- Auth: email/password, Google + Apple (web popup and native via `@capacitor-firebase/authentication`), password reset, email verification, 18+ age gate, show/hide password.
- Onboarding: display name, activities + subcategories + skill level, home base, availability, profile prompt.
- Core tabs: Home feed (posts), Activities, Tribes (detail + member group chat), Marketplace (categories + ROAMR Apparel tab), Profile (Hinge-style: photo grid, prompts, vitals, completeness meter).
- Social: likes, comments, follows, joins, search, notifications inbox + push, DMs, invite/share links.
- Safety: safety center, verify, emergency info, safety controls, waiver, trip plans + overdue-trip cron, reviews/references.
- Trust & security: report/block (enforced in feeds, DMs, group chat), hardened Firestore/Storage rules, PII in private subcollection, server-side counters + rate limits, CSP/security headers, consent banner, account deletion.
- Help Center, on-device Help Bot, Guides, About, in-app legal pages (`/legal/:doc`).
- Tests (vitest + rules tests) and CI (lint, test, coverage gate, build, audit, gitleaks).

## Open — needs code
- [ ] Firestore field-validation rules + move `fcmTokens`/`notificationPrefs` to private subcollection — verify with `npm run test:rules` first (CHECKLIST-STATUS.md).
- [ ] Account-deletion fan-out as a Cloud Function (other users' presence docs, Storage cleanup) — client-side only today.
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

## Next up (pick from here)
1. Push any unpushed local work and update this file.
2. Device test pass → log bugs in ROAMR-BACKLOG.md.
3. Deploy rules/indexes + hosting so there's a public link.

## Decisions worth remembering
- Firebase only, no custom server (docs/adr/0002).
- Rate limits fail open, so a bug can't lock out real users.
- Coverage gate is scoped to the unit-testable core only; `image.js` is excluded because it's canvas code.
