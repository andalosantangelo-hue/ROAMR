# ROAMR — Tests & CI

## Run
```bash
npm run test        # unit tests (Vitest + jsdom + Testing Library) — 12 tests
npm run test:watch  # watch mode
npm run build       # production build (also a correctness gate)
```

## What's covered
- `src/lib/util.test.js` — `toggleSet` (the optimistic add/remove used by every
  Like/Join/Save toggle: immutability, round-trip) and `initials`.
- `src/lib/image.test.js` — `compressImage` guards (null + non-image pass through).
- `src/components/ErrorBoundary.test.jsx` — renders children normally and shows the
  graceful fallback when a child throws (no white screen).

These test real shipped code (the helpers were extracted from the contexts/cards
and are imported by them), so green tests mean the live paths behave.

## Security-rules tests (the security boundary — highest value)
`test/rules.test.js` proves `firestore.rules` with the emulator. It is excluded
from the default `npm run test` (needs Java + the emulator). To run:
```bash
npm i -D @firebase/rules-unit-testing
firebase emulators:exec --only firestore "npm run test:rules"
```
Covers: users can only write their own doc; counters can't be tampered; posts
can't be created spoofing another author or with inflated counts; likes only as
yourself; reports are create-only (no client read).

## CI
`.github/workflows/ci.yml` runs lint + unit tests + build on every push/PR
(Node 20). If your git repo root is the ROAMR folder (not roamr-app), move
`.github/` to the repo root and set `working-directory: roamr-app` on the steps.
