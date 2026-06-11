# ROAMR — Invite links & deep linking

The viral loop: a user shares an invite to a tribe/activity/post; the recipient
taps the link, signs in if needed, and lands directly on that item with a Join CTA.

## How it works (already built)
- `src/lib/share.js` builds `${origin}/invite/{type}/{id}` and opens the native
  share sheet (Web Share API) with clipboard fallback.
- Share triggers: the paper-plane on posts and activities, and the invite icon on
  tribe cards. Each fires `invite_share` analytics.
- `/invite/:type/:id` (`src/screens/Invite.jsx`) is auth-guarded. A signed-out
  invitee is sent to Login; after sign-in they're redirected back to the invite
  (Login honors the `from` route) and can Join in one tap.

## Native deep linking (YOU — for the installed app to open these links)
Web works out of the box. For the iOS/Android app to capture `roamr.app/invite/...`:

### iOS — Universal Links
1. Host an Apple App Site Association file at
   `https://<your-domain>/.well-known/apple-app-site-association` (JSON, no extension):
   ```json
   { "applinks": { "details": [{ "appID": "TEAMID.com.roamr.app", "paths": ["/invite/*"] }] } }
   ```
2. Xcode → Signing & Capabilities → Associated Domains → `applinks:<your-domain>`.

### Android — App Links
1. Host `https://<your-domain>/.well-known/assetlinks.json` with your app's
   package (`com.roamr.app`) + signing-cert SHA-256.
2. Add an intent-filter for the `/invite` path in `AndroidManifest.xml`
   (autoVerify=true).

### Capacitor glue
Use `@capacitor/app` `appUrlOpen` listener to route an incoming deep link into the
React Router path (`/invite/...`). Add when you wire the native projects.

> Until Universal/App Links are configured, invite links open in the browser PWA,
> which already handles the full flow.
