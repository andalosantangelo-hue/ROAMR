# Firebase feature audit for ROAMR

Every product in your console, mapped to ROAMR. The goal isn't to switch everything on —
it's to use the right tools well and skip the rest.

Legend: ✅ in use · 🟡 partly set up · ⬜ not yet (recommended) · 🚫 skip (not for this stack)

---

## A. Already powering ROAMR ✅
| Product | What it does for you | Status |
|---|---|---|
| Authentication | Email + Google + Apple sign-in, email verification, age gate | ✅ live |
| Firestore | Your main database (posts, activities, tribes, listings, users) | ✅ live, hardened rules |
| Storage | Photo uploads (compressed, owner-scoped) | ✅ live |
| Cloud Functions | Server-side counters, rate-limiting, push triggers | ✅ live (deployed) |
| Cloud Messaging (FCM) | Push notifications | ✅ wired (send via triggers) |
| Analytics | Event logging (sign_up, create_success, etc.) | ✅ logging, see §C to go deeper |
| Hosting | The public web app URL | 🟡 built, **needs one deploy** |
| App Check | Bot/abuse protection | 🟡 app registered, **not enforced yet** |

## B. Turn on next — highest ROI ⬜
1. **App Check — finish enforcement** (you're on this screen). Register the reCAPTCHA v3
   provider for the web app, put the site key in `VITE_RECAPTCHA_SITE_KEY`, then flip
   enforcement ON for Firestore + Storage + Functions. Code's already scaffolded. *Security.*
2. **Remote Config** — feature flags + live tuning with **no redeploy**. Perfect for ROAMR:
   toggle features on/off, kill-switch a broken screen, run seasonal banners, and **tune your
   rate-limit thresholds** without shipping code. High leverage for a live app.
3. **App Distribution** — send pre-release iOS/Android builds straight to you, Christian, and
   testers (no App Store wait). This is the fastest way to *get the real app on your phones*
   for bug-hunting before you publish.
4. **Analytics — go deeper** (you already log events): mark key events as **conversions**
   (sign_up, create_success), build **funnels** (splash → signup → first post), create
   **Audiences** (e.g. "signed up but never posted") for re-engagement, and use **DebugView**
   while testing.

## C. Worth adding once the native app is building 🟡
| Product | Why for ROAMR | When |
|---|---|---|
| Crashlytics | Real-time crash reports on iOS/Android (web is covered by Sentry) | with native build |
| Performance Monitoring | Track screen load + network latency on real devices | with native build |
| Cloud Messaging — Composer | Send re-engagement campaigns ("New tribes near you") beyond trigger pushes | post-launch |
| A/B Testing | Experiment on onboarding, copy, or notifications via Remote Config | post-launch |
| Test Lab | Run your app on a matrix of real devices in the cloud | pre-store |

## D. AI services — real future potential (not now) 🟡
- **AI Logic (Gemini in Firebase)** — could power smart search, trip suggestions, or
  auto-generated activity descriptions.
- **ML Kit** — on-device image labeling for uploaded photos (auto-tag "mountain", "lake").
- **Content moderation** — Gemini could auto-screen new posts/photos and feed your existing
  `reports` / `abuseFlags` pipeline. Strong fit later for a UGC app.
Park these in the backlog as growth bets — none are launch blockers.

## E. Skip — not for your stack 🚫
| Product | Why skip |
|---|---|
| SQL Connect / Data Connect | A Postgres/SQL database. ROAMR uses Firestore — don't set this up (adds cost). |
| App Hosting | For full-stack SSR frameworks (Next.js/Angular). Your app is a static Vite SPA → plain **Hosting** is correct. |
| Dynamic Links | **Deprecated / shutting down.** You already built your own invite + deep-link landing — keep that. For native, use iOS Universal Links / Android App Links directly. |
| Phone Verification / phone auth | Adds SMS cost + signup friction. You already have email + Google + Apple — skip unless you specifically want phone login. |

---

## Recommended order
1. Deploy **Hosting** (so you can see it) →
2. Finish **App Check** enforcement (security) →
3. **App Distribution** (get native builds to testers) →
4. **Remote Config** (flags + tune rate limits) →
5. **Analytics** conversions/funnels/audiences →
6. Native: **Crashlytics + Performance** →
7. Later: **A/B Testing**, **AI/moderation**.
