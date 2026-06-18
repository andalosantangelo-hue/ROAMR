# 2. Firebase backend, no custom server

Date: 2026-06-18 · Status: Accepted

## Context
Small team, need auth, realtime data, storage, push, and a path to mobile. Cannot run/operate
a bespoke backend reliably yet.

## Decision
Use Firebase end-to-end: Auth, Firestore, Storage, Cloud Messaging, Cloud Functions, Hosting.
Enforce all integrity/authorization in **Firestore security rules** (`keysOnly()` whitelists,
`unchanged()` for server-maintained fields) and put privileged logic (counters, rate limiting,
notifications, the overdue-trip cron) in **Cloud Functions**. Wrap the same React app with
Capacitor for iOS/Android.

## Consequences
- No server to operate; scales managed. Vendor lock-in to Firebase is accepted.
- Anything that must be tamper-proof (counts, trust scores, escalation) lives server-side.
- External integrations that Functions can't do alone (SMS/email to an emergency contact)
  need a provider (Twilio/SendGrid) — tracked as the one remaining wire-up.
