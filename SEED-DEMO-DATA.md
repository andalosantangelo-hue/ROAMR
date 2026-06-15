# Seeding demo data (optional, recommended before sharing the public link)

A brand-new ROAMR install has empty feeds. This script fills Firestore with six
sample explorers and their posts, activities, tribes, and marketplace listings so
the app looks alive the moment someone opens the link. It writes with the Firebase
**Admin SDK**, so it bypasses security rules — run it from a trusted machine only.

## One-time setup
1. From the app root (`roamr-app/`), install the admin SDK:
   ```
   npm i firebase-admin
   ```
2. In the Firebase Console: **Project settings → Service accounts → Generate new
   private key**. Save the downloaded JSON somewhere safe (do **not** commit it).
3. Point the script at that key:
   - macOS/Linux: `export GOOGLE_APPLICATION_CREDENTIALS="/abs/path/serviceAccount.json"`
   - Windows PowerShell: `$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\serviceAccount.json"`

## Run it
```
node scripts/seed-demo.mjs
```
You'll see `Seeded N demo documents.` Open the app — Home, Activities, Tribes, and
Marketplace will all be populated.

## Remove it later
```
node scripts/seed-demo.mjs --clear
```

## Notes
- Demo docs use fixed ids prefixed `demo_`, so re-running just updates them (no dupes).
- The sample users are profile documents only (no Auth accounts). They show up in
  feeds and on profiles; nobody can log in as them.
- Photos load from Unsplash/pravatar over HTTPS, which the app's CSP already allows.
- Group chat and DM threads are intentionally left empty — those populate as soon as
  real members start chatting.
