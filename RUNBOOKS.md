# ROAMR — Operational runbooks

Quick recovery steps. Firebase project: `roamr-55afb`. CLI: `npm i -g firebase-tools`.

## Deploy
```bash
npm run build
firebase deploy --only hosting                 # web/PWA
firebase deploy --only firestore:rules,storage,firestore:indexes
firebase deploy --only functions               # needs Blaze plan
```

## Roll back a bad web release
```bash
firebase hosting:rollback                       # reverts to previous Hosting version
```
(Or in console → Hosting → Release history → "Rollback".)

## Roll back bad security rules
Console → Firestore/Storage → Rules → "Edit rules" history → restore a previous version,
or re-deploy the last known-good `firestore.rules`/`storage.rules` from git:
```bash
git checkout <good-commit> -- firestore.rules storage.rules
firebase deploy --only firestore:rules,storage
```

## Restore data from backup
Requires Firestore scheduled exports / PITR enabled (see SECURITY.md TODO).
```bash
gcloud firestore import gs://<bucket>/<export-folder>
```
PITR: console → Firestore → Backups → restore to a timestamp.

## Rotate / revoke keys
- Leaked Firebase web API key: console → Project settings → restrict the key
  (HTTP referrer / app restriction) in Google Cloud Console → Credentials.
- Service-account key: GCP IAM → Service accounts → Keys → delete + recreate.
- Sentry DSN / reCAPTCHA key: regenerate in their dashboards, update `.env`.

## Disable a feature fast
- Turn off a sign-in provider: console → Authentication → Sign-in method.
- Kill abuse: enable App Check enforcement (console → App Check).
- Take the app offline: Hosting → disable, or deploy a maintenance `index.html`.

## Incident response (MVP)
1. Assess scope (who/what affected). 2. Stop the bleed (rollback / disable feature /
   tighten rules). 3. Communicate to users if data is involved. 4. Write a short
   blameless postmortem. Named on-call: founders.
