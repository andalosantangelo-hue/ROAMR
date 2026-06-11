# ROAMR — Production checklist status

Audited against the full launch/security checklist. The core app-security layer is
strong; remaining gaps are mostly **operational/legal** (your accounts & decisions),
not code. ✅ done · ⚠️ partial · ❌ todo.

## Fixed in code (this pass)
- ✅ Security headers + CSP (firebase.json → hosting.headers) and a web Hosting target.
- ✅ File-upload hardening — Storage rejects SVG, allows only raster images < 10 MB.
- ✅ Removed deprecated email-enumeration login flow → clean email+password + Sign in/Create toggle; Terms/Privacy are real links.
- ✅ Error logging wired (Sentry, env-gated via VITE_SENTRY_DSN) in app + ErrorBoundary.
- ✅ App Check scaffolded (env-gated via VITE_RECAPTCHA_SITE_KEY) for bot/rate-limit/abuse.
- ✅ Search debounced.
- ✅ CI: dependency audit + gitleaks secret scan added.
- ✅ Emojis removed from app/notification copy.
- ✅ SECURITY.md, RUNBOOKS.md, .env.example added.
- ✅ **Rate limiting / brute-force + spam protection** — server-authoritative, fail-open per-user
  limits in Cloud Functions (posts 40/h, activities 40/h, listings 25/h, tribes 15/h, comments 80/h,
  reports 25/day, follows 250/h). Over-limit docs are removed; counters stay consistent; trips are
  logged to a server-only `abuseFlags` collection. Cannot lock out legitimate users (fails open).
  App Check remains the complementary platform-level limiter (enforcement = your console step).
(Already passing before this pass: auth + route/rules authz, owner-only writes, server-only
counters, IDOR/XSS protection, account deletion, report/block, offline, tests + rules tests + CI,
indexes, image compression, error boundary, skeletons.)

## Needs the emulator before shipping (code prepared, test-gated)
- ⚠️ Firestore **field-validation rules** (type/size + key whitelist on create) and moving
  `fcmTokens`/`notificationPrefs` to an owner-only private subcollection. These must be
  verified with `npm run test:rules` (Firebase emulator) so they don't block real writes.

## Operational — YOU (accounts/config, can't be coded here)
- ❌ Enable **App Check** enforcement (console) + set the reCAPTCHA key in `.env`.
- ❌ **Backups**: enable Firestore PITR + scheduled export to a GCS bucket; do one restore drill.
- ❌ **Monitoring/alerting**: GCP alert policies on function errors + auth failures; an uptime check.
- ❌ **Staging project** separate from production (`roamr-55afb`).
- ❌ Create the **Sentry** project; paste its DSN into `.env`.
- ❌ Turn on **branch protection** (require PR + CI green) in GitHub repo settings.

## Legal / launch — YOU
- ❌ Publish **Privacy Policy** + **Terms of Service** pages; point roamr.app/privacy & /terms at them.
- ❌ **App Store / Play**: Info.plist usage strings, app icon (`@capacitor/assets`), privacy
  labels, developer accounts (see SHIP-BLOCKERS.md).
- ❌ Confirm **Premium** won't charge money at launch (no payment processor wired — display only).
- ⚠️ Accessibility statement + WCAG contrast pass.

## Not applicable (awareness items)
Kubernetes/Docker/Lambda/Redis/Kafka/SQL-injection/Stripe-MoR/webhooks/SSR headers — not part
of this Firebase + Vite + Capacitor stack at MVP scale.
