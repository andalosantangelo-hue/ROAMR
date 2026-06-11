# ROAMR — App Store / Play ship-blockers (BACKEND-PLAN §9.A)

Status of each blocker. ✅ = done in code. ⚠️ = needs you (config/content/console).

## ✅ 9.A.1 — In-app account deletion
Profile → Account Settings → **Delete account** (confirm dialog → permanent).
`deleteAccount()` in AuthContext deletes the user's owned `posts`/`activities`/
`listings`/`tribes`, their `users/{uid}` doc, then the Auth user. If the session
is stale (`auth/requires-recent-login`) the UI tells them to sign out/in and retry.
> MVP teardown is client-side. The robust fan-out (presence docs across other
> people's content, Storage cleanup) is a Cloud Function — bundle with §9.B.

## ✅ 9.A.2 — Email/Password lifecycle
Sign-out (Settings + Profile) and password reset (Login "Forgot password?") done.
⚠️ Email verification banner = still **High**, not built.

## ✅ 9.A.3 — Report + block + filter
- Every post/activity card ⋯ menu → **Report** (writes `reports/{id}`) and
  **Block user** (writes `users/{uid}/blocked/{targetUid}`).
- Blocked authors are filtered out of the Home and Activities feeds live.
- Settings → Blocked accounts → Unblock.
- ⚠️ **Review path:** triage `reports` (status == "open") by hand in the Firebase
  console for MVP; publish a contact email + 24h response commitment in your Terms.

## ⚠️ 9.A.4 — Privacy Policy, Terms, Info.plist  (YOU)
1. **Privacy Policy + Terms** — host two pages (your marketing site works) and put
   the URLs at `/privacy` and `/terms` (Settings already links there). Privacy
   Policy must disclose Firebase/Google as processor, what's collected (email,
   photos, content, analytics), and the account-deletion path.
2. **iOS Info.plist** — after `npx cap add ios`, add to `ios/App/App/Info.plist`
   (without these, iOS crashes on first photo/camera use):
   ```xml
   <key>NSPhotoLibraryUsageDescription</key>
   <string>ROAMR needs access to your photos so you can add images to posts, activities, listings, and your profile.</string>
   <key>NSCameraUsageDescription</key>
   <string>ROAMR needs camera access so you can take photos for your posts, activities, and listings.</string>
   ```
   Android `READ_MEDIA_IMAGES` is handled by the Capacitor Camera plugin manifest.

## ⚠️ 9.A.5 — App icon, splash, store listing  (YOU)
- Drop a 1024×1024 `icon.png` (+ splash source) and run
  `npx @capacitor/assets generate` to emit all densities (default icon = instant
  reject). You have ROAMR icon assets already in the asset kit.
- Store listing: screenshots, descriptions, App Privacy "nutrition label" (iOS) /
  Data Safety form (Play) — declare email, photos, user content, analytics.

## Security rules to add for these collections (apply with the others)
```
match /reports/{id} {
  allow create: if request.auth != null
                && request.auth.uid == request.resource.data.reporterId;
  allow read, update, delete: if false;   // triage in console only
}
match /users/{uid}/blocked/{targetUid} {
  allow read, write: if request.auth.uid == uid;
}
```

## Remaining (BACKEND-PLAN §9.B / §9.C — High, fast-follow)
Push notifications + Cloud Functions, offline persistence + banner, analytics
funnels, Crashlytics, email verification, provider-linking/duplicate-email.
