# ROAMR — architecture overview

Mobile-first React (Vite + Tailwind, react-router) wrapped with Capacitor for iOS/Android,
backed entirely by Firebase. No custom server — security and integrity live in Firestore
rules + Cloud Functions.

```mermaid
flowchart TD
  subgraph Client [React app (web + Capacitor iOS/Android)]
    UI[Screens] --> Ctx[Context stores: Auth, Posts, Activities, Tribes, Listings, Messages, Safety]
    Ctx --> SDK[Firebase Web SDK]
  end
  SDK -->|Auth| FAuth[Firebase Auth\nemail / Google / Apple]
  SDK -->|reads/writes\n(guarded by rules)| FS[(Cloud Firestore)]
  SDK -->|images| ST[(Cloud Storage)]
  SDK -->|tokens| FCM[Cloud Messaging]
  FS --> CF[Cloud Functions]
  CF -->|server-authoritative counters,\nrate limiting, notifications,\noverdue-trip cron| FS
  CF --> FCM
  FAuth -. App Check (reCAPTCHA v3) .-> SDK
  CF -. Sentry / GCP logs .-> Obs[Observability]
```

**Key principles**
- **Trust on the server.** Counters (likes/members/ratings/adventures), rate limits, and the
  overdue-trip escalation run in Cloud Functions; clients can't tamper (rules `unchanged()`).
- **Least-privilege rules.** Every write is validated by `keysOnly()` whitelists + `strMax()`;
  per-user isolation; PII + medical in an owner-only private subdoc.
- **Offline-first.** `persistentLocalCache` + `onSnapshot` live updates; optimistic UI with rollback.
- **Config as code.** `firestore.rules`, `firestore.indexes.json`, `storage.rules`, `firebase.json`.

See `BACKEND-PLAN.md` for the full data model and `adr/` for decisions.
