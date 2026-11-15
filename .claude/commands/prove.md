---
description: Run ROAMR's full "done" standard on the current branch and report results
---

Run the full test standard from CLAUDE.md on the current branch (or on $ARGUMENTS if it
names a branch or PR). Run every step even if an earlier one fails, then report.

1. `npm ci` and `npm ci --prefix functions` if `node_modules` is missing or stale.
2. `npm run lint` — must be clean.
3. `npm run test` — unit tests.
4. Rules tests (security):
   `npx firebase emulators:exec --project demo-roamr --only firestore,storage "npx vitest run --config vitest.rules.config.js"`
   If the change adds a field, collection or permission, first add rules tests that try to
   break it: another user reading/writing it, oversized or extra fields, client-written
   counters.
5. `npm run build` — must succeed.
6. 100-user e2e on the emulators (never production):
   ```bash
   node e2e/make-avatars.mjs
   VITE_USE_EMULATORS=1 npm run build
   npx firebase emulators:exec --project demo-roamr --only auth,firestore,storage,functions \
     "npx vite preview --host 127.0.0.1 --port 5173 --strictPort & until curl -s http://127.0.0.1:5173 > /dev/null; do sleep 1; done; node e2e/synthetic-users.mjs 100 4"
   ```
   It takes a while: run it in the background. Kill any leftover `vite preview` first, or
   the run silently tests whatever build is already on port 5173.
   Results: `e2e/.results/results.json`, screenshots in `e2e/.results/shots/`.
7. Screenshots of every screen the change touches (Playwright against the emulator build),
   shown to the owner.
8. Report: a table of each step (pass / fail / not run, with counts), anything flaky, and
   what this does NOT prove (emulators are not production load; this is not a pen test).

## Claude cloud sandbox only
If the emulators fail with `request blocked: no rule allows host "127.0.0.1"` or Playwright
says `Executable doesn't exist at /opt/pw-browsers/...`, prefix the e2e and rules commands
with:
```bash
PW_EXEC=/opt/pw-browsers/chromium NODE_OPTIONS="--require $PWD/.claude/sandbox-shim.cjs"
```
Never use this in CI or on a laptop.
