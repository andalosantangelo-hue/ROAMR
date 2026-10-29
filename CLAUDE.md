# ROAMR — Claude working notes

Outdoor-recreation social app (find partners, tribes, activities, gear). MVP, pre-launch.
Owners: Andalo + Christian. Firebase project: `roamr-55afb`.

**Start every session by reading `PROGRESS.md`** (current state + next tasks). Update it
before ending a session or running `/clear`.

## Stack
React 19 + Vite 8 + Tailwind 3 + react-router 7 · Capacitor 8 (iOS/Android) · Firebase
(Auth, Firestore, Storage, FCM, Cloud Functions in `functions/`) · Sentry + App Check
(both env-gated, see `.env.example`). No custom server.

## Commands
```bash
npm run dev          # local dev
npm run lint         # must be clean
npm run test         # vitest unit tests (excludes test/rules.test.js)
npm run test:rules   # Firestore rules tests — needs Java + emulator
npm run build        # must succeed; CI gate
firebase deploy --only firestore:rules,firestore:indexes   # after rules/schema changes
firebase deploy --only hosting                              # public site
```
MCP: `.mcp.json` registers the Refero design-reference server; export `REFERO_API_KEY`
in your shell (never commit the key).

CI (`.github/workflows/ci.yml`): lint → test → coverage gate (util.js, ErrorBoundary) →
build → audit, plus gitleaks.

## Layout
- `src/App.jsx` — all routes. `/app/*` = 5-tab shell (home, activities, tribes, marketplace, profile); everything else wrapped in `RequireAuth`.
- `src/screens/` — one file per screen. `src/components/` — shared UI.
- `src/store/*Context.jsx` — data layer (Auth, Posts, Activities, Tribes, Listings, Messages, Safety, FeedScope). Screens talk to Firestore through these, not directly.
- `src/lib/` — firebase init, chat, feed, profile, safety, image compression, push, analytics.
- `functions/index.js` — server-authoritative counters, rate limits, notifications, overdue-trip cron.
- `firestore.rules`, `storage.rules`, `firestore.indexes.json` — security boundary.

## Rules of the road
- **Any new field or collection needs `firestore.rules` updated** (rules use `keysOnly()` whitelists + `strMax()`) or client writes are rejected. Add a case to `test/rules.test.js`.
- Counters (likes, members, ratings) are written only by Cloud Functions — never from the client.
- PII/medical data lives in an owner-only private subcollection under `users/{uid}`.
- Design tokens in `tailwind.config.js` (green #7DAD3F, navy #173142, Poppins). Keep WCAG AA contrast (see ACCESSIBILITY-CONTRAST.md).
- Branches: `feature/<area>` → PR into `main` (template in `.github/`). Never commit secrets.
- Don't develop from OneDrive folders — Git and OneDrive conflict (COLLABORATION.md).

## Saving context
The repo root has ~25 status/plan markdown files. **Don't read them by default.** Open one
only when the task needs it:
- data model / backend design → `BACKEND-PLAN.md` (large, ~39KB — grep it, don't read whole)
- launch/ops to-dos → `GO-LIVE.md`, `SHIP-BLOCKERS.md`
- native auth → `docs/NATIVE-AUTH-SETUP.md`, `AUTH-SETUP.md`
- screens/flows → `UX-FLOW-MAP.md`
Prefer grep or reading a line range over reading whole files. Use an Explore subagent for
broad "where is X" searches.
