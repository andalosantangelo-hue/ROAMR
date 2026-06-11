# ROAMR — Pre-launch red-team audit (read-only)

8-persona audit of the codebase. ROAMR ground truth: Firebase-only; **no payments/Stripe**,
**no direct messages**, **no GPS/maps**, **no AI**. Severity = impact × exploitability × likelihood.

## Fixed in code (this pass — safe, no deploy needed)
- ✅ In-app Privacy/Terms links were broken (relative → redirected to splash). Now absolute
  `https://roamr.app/privacy` & `/terms`, open in new tab. (You still must publish those pages.)
- ✅ Dead "Upgrade to Premium" button → "Join the Premium waitlist" (opens a real URL).
- ✅ Dead "Contact seller" button → "View seller profile" (real, existing feature).
- ✅ Image uploads now ALWAYS re-encode to JPEG (strips EXIF/GPS); never upload the original,
  abort if undecodable. Closes the home-location leak via photo metadata.
- ✅ Google Analytics no longer auto-fires before consent (gated on a stored consent flag) —
  removes the EU/GDPR pre-consent analytics exposure.

## TOP CRITICAL — must do before launch (NOT auto-fixed; need testing/decisions/accounts)
1. **PII exposure (H1/P1 — highest):** every signed-in user can read every other user's
   `email`, `phoneNumber`, `fcmTokens`, `notificationPrefs` (the `users/{uid}` doc is
   readable by any signed-in user; `Discover.jsx` already lists users). → Split private fields
   into `users/{uid}/private/*` (owner-read only); keep only public profile fields public.
   **Must be emulator-tested** (`npm run test:rules`) because push.js/Settings write those fields.
2. **Account deletion is incomplete (P3/AS3):** `deleteAccount` removes Firestore docs but NOT
   Storage photos or post/activity subcollections — "deleted" photos stay public forever
   (GDPR right-to-erasure fail + unbounded Storage cost). → Cloud Function to delete Storage
   objects + subcollections on account/content delete.
3. **No age gate (L1):** COPPA/13+ + store age rating. → add a DOB / "13 or older" check at signup.
4. **Privacy Policy + Terms pages don't exist:** publish them (links now point there).
5. **App Check disabled (S2):** unlimited account creation + full-userbase scrape possible.
   → enable App Check (set `VITE_RECAPTCHA_SITE_KEY` + enforce in console).
6. **Info.plist photo usage string (AS1):** iOS crashes on first photo pick without it.
7. **Sign in with Apple via web popup (AS4):** unreliable in a native webview — use native SiwA.
8. **`users` update rule allows arbitrary keys (H2):** add `keysOnly([...])` to the update rule
   (emulator-test first — push.js/Settings write fcmTokens/notificationPrefs).
9. **`subscription` settable on user-doc re-create (monetization):** the day premium gating ships,
   move `subscription` to server-only (Cloud Function), like counters are now.
10. **Subscription/billing UI without IAP (AS5):** confirm Premium won't charge at launch, or wire StoreKit.

## Ranked top-10 lists
**Launch blockers:** age gate · Privacy/Terms pages+links · Info.plist · PII exposure ·
deletion incompleteness · App Check off · native SiwA · dead marketplace contact · dead Premium
button · analytics consent.
**Lawsuit risks:** COPPA · all-users email/phone harvest · erasure failure (public photos) ·
EXIF/GPS leak · analytics consent · no meetup/gear assumption-of-risk waiver · unenforceable
click-wrap · CAN-SPAM disclosure · FCM token exposure · processor disclosure.
**App Store rejection:** Info.plist crash · no reachable privacy policy · no age rating ·
incomplete deletion · native SiwA · subscription UI w/o IAP · default icon · UGC report SLA ·
dead buttons ("incomplete app") · unused camera permission.
**Cost at scale:** per-interaction Cloud Function reads + FCM · unbounded per-user
collection-group listeners · Storage never cleaned · users full-collection getDocs · 6+ live
listeners/session · no feed pagination · notification writes per interaction · recentAttendees
contention on hot activities · 10MB images after failed compression · no App Check amplification.
**Competitors would mock:** Upgrade button dead · Contact seller dead · Community dropdown fake ·
filter button decorative · Help/About/Request-here dead (+ fake verified badge, seed data leaking
into empty feeds). *(First three now fixed/neutralized.)*
**Security vulns:** PII read · App Check off · users update arbitrary keys · subscription re-create ·
userbase enumeration · public Storage no expiry · FCM token exposure · no content-creation caps ·
price negative via direct API · PII-ish paths in logs.
**Privacy vulns:** cross-user email/phone/FCM · photos survive deletion · EXIF/GPS fallback (now fixed) ·
analytics consent (now fixed) · prefs/subscription readable · orphaned subcollections ·
client-only erasure · scrapeable bucket · invite link exposure · logs.
**Monetization vulns:** zero premium enforcement · subscription client-settable on re-create ·
dead upgrade funnel · marketplace no take-rate · billing copy w/o processor · no IAP · price not
validated server-side · no in-app path to premium · no receipt validation · "manage on app store"
points at nothing.

## Verified NOT vulnerable
Write-IDOR (owner checks enforced) · counter inflation (server-only Cloud Functions, create forces 0) ·
XSS (React escaping, no dangerouslySetInnerHTML) · SVG upload (blocked) · secrets (only public web
config committed) · SQL injection (no SQL) · mass-DM (no messaging system) · payment forgery (no payments).
