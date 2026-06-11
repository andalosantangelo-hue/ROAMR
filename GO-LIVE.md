# ROAMR — GO-LIVE checklist (the only things left, all require YOU)

Everything in the audit that could be fixed in code is done (see AUDIT-REPORT.md +
CHECKLIST-STATUS.md). The items below need your accounts/decisions — none can be done
from the build environment. Ordered by what unblocks the most.

## A. Push the latest code to GitHub
Extract the latest `ROAMR-app-files.zip`, copy into your repo folder, Commit → Push
(GitHub Desktop). CI will run lint+tests+build.

## B. Deploy the security rules (do this — your data is currently in production-mode default)
```bash
cd roamr-app && npm install
npm run test:rules          # verify the hardened + private-data rules pass (needs Java; your machine has it)
firebase deploy --only firestore:rules,storage,firestore:indexes
```
Or paste firestore.rules / storage.rules into the Firebase console (Rules tab → Publish),
like we did before. This activates: private email/phone/tokens, field validation, anti-tamper.

## C. Host the legal pages (lawyer + App Store blocker)
The app links to roamr.app/privacy, /terms, /accessibility, /help, /about, /premium.
Publish the drafts in `roamr-app/legal/` (privacy.html, terms.html, accessibility.html) on
your site at those URLs. **Have a lawyer review them** — fill the [DATE]/[ENTITY]/[JURISDICTION]
placeholders. (Add simple /help, /about, /premium pages too, or repoint those links.)

## D. Turn on App Check (stops mass fake accounts + user scraping)
Firebase console → App Check → register the web app with **reCAPTCHA v3** → copy the site key →
put it in `.env.local` as `VITE_RECAPTCHA_SITE_KEY=...` → rebuild → enable **enforcement** on
Firestore + Storage in the console.

## E. Blaze plan (only when you want Storage uploads + push + Cloud Functions live)
Upgrade to Blaze (pay-as-you-go) and **set a budget alert** (e.g. $10). Then:
```bash
cd functions && npm install && cd ..
firebase deploy --only functions     # counters + notifications + (add later) deletion/storage cleanup
```
With no users your bill is ~$0. Storage image uploads and push need this.

## F. Native build → TestFlight / Play (when ready to ship to phones)
```bash
npm run build && npx cap add ios && npx cap add android
npx @capacitor/assets generate       # real app icon/splash (default icon = instant reject)
```
- iOS `Info.plist`: add `NSPhotoLibraryUsageDescription` (see SHIP-BLOCKERS.md) — without it iOS crashes on photo pick.
- **Sign in with Apple on native:** the current web-popup flow is unreliable in a native webview.
  Wire `@capacitor-community/apple-sign-in` (native credential → `signInWithCredential`) before submitting. Test on a device.
- App Store/Play listing: screenshots, description, **age rating (13+)**, and the **privacy
  nutrition label / Data Safety form** (declare: email, photos, user content, identifiers, analytics).

## G. Operational hardening
- **Backups:** Firestore console → enable Point-in-Time Recovery + a scheduled export to a GCS bucket; do one restore test (RUNBOOKS.md).
- **Monitoring/alerting:** GCP alert policies on function errors + auth failures; an uptime check on the hosted URL.
- **Staging:** create a second Firebase project for testing, separate from production.
- **GitHub:** Settings → Branches → protect `main` (require PR + passing CI).
- **Sentry (optional):** create a project at sentry.io, put its DSN in `.env.local` as `VITE_SENTRY_DSN=...`.

## H. Bigger follow-ups (not blockers, plan post-launch)
- Cloud Function for server-side account-deletion fan-out (other users' presence docs + tribe images) and report auto-actioning.
- Cursor pagination on feeds as content grows; revisit per-user collection-group listeners at scale.
- If/when you monetize: move `subscription` to server-only (Cloud Function) and wire real StoreKit/Play billing before any premium gating.
