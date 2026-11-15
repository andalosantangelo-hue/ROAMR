# Journey (a) design brief — Sign in → Onboarding → First feed

Working brief for the Refero pass on journey (a) (`UX-FLOW-MAP.md` §Journey (a)).
Use it from a **local** Claude Code session with `REFERO_API_KEY` set; the cloud
sessions cannot reach `api.refero.design`.

## How to use Refero per screen

1. Run the listed searches; pull 3–5 references per screen.
2. Pick **one** pattern per screen, judged only against that screen's primary
   action below. "Looks nicer" is not a criterion.
3. Rebuild with existing tokens (`tailwind.config.js`: green #7DAD3F, navy
   #173142, Poppins). Keep WCAG AA contrast (`ACCESSIBILITY-CONTRAST.md`).
4. One PR per screen. The defects under **Fix first** ship before any visual work.

## Fix first (not visual — Refero won't surface these)

| # | Screen | Defect | Why it matters |
|---|---|---|---|
| F1 | Login | 18+ gate only runs on email sign-up. Google/Apple go straight to onboarding, and DOB is never stored. | Anyone under 18 can join via a social button. Move the DOB check into onboarding step 1 so every path hits it. |
| F2 | Home | `PostsContext` swallows `onSnapshot` errors (`console.warn` → `loading=false`), so a failed load renders "Your feed's quiet". | Users see an empty feed instead of the spec'd ⚠️ retry banner. Expose `error` and render a retry state. |
| F3 | Onboarding | `finish()` catches and ignores save failures, then navigates home. | Interests silently don't save → feed isn't personalized → the journey's ✨ moment fails with no signal. Show an inline error and stay on the screen. |
| F4 | Home | "For You" empty state says "Tap + to post" with no button. | Spec calls for a CTA; text pointing at a FAB is a dead end. |

## Screen briefs

### 1. Splash (`src/screens/Splash.jsx`)
- **Primary action:** Get Started.
- **Today:** full-bleed hero + one CTA. Solid. A fake iOS home-indicator bar is
  drawn under the button; on device iOS draws its own, so it doubles up.
- **Refero searches:** `outdoor app welcome screen`, `onboarding splash full-bleed photo`,
  `AllTrails welcome`, `Strava welcome`.
- **Decide:** whether to add a secondary "I already have an account" link
  (saves returning users one tap — they currently hit the sign-up-flavored copy).

### 2. Login (`src/screens/Login.jsx`)
- **Primary action:** Continue (email/password, Google, Apple).
- **Today:** email form sits *above* the social buttons; errors render *below*
  the social buttons (far from the field that failed); busy state is a bare "…".
  Sign-in and sign-up share one screen via a text toggle.
- **Refero searches:** `sign in with apple google email`, `social login first`,
  `auth screen error state`, `login inline validation`.
- **Decide:** social-first vs email-first ordering (most consumer outdoor apps
  lead with Apple/Google); inline field errors; a real spinner.

### 3. Onboarding (`src/screens/Onboarding.jsx`)
- **Primary action:** Continue (≥1 activity picked).
- **Today:** 2 steps, ~8 inputs (name, categories, sub-activities, skill per
  category, home base, availability, next adventure). No progress indicator.
  Home base is free text even though `LocationField` exists.
- **Refero searches:** `interest picker onboarding`, `onboarding progress steps`,
  `skill level selector`, `Strava onboarding`, `Meetup interests`.
- **Decide:** what can be deferred to the profile. Only interests feed the
  first feed's ranking (`lib/feed.js` scores interest matches ×5); availability
  and "next adventure" don't affect journey (a) and cost completion rate.

### 4. Home feed, first visit (`src/screens/Home.jsx`)
- **Primary action:** Create post (FAB).
- **Today:** skeletons ✔, scope-specific empty copy ✔, Discover module when
  follows < 5 ✔. Missing: error/retry state (F2), empty-state CTA (F4), and any
  visible sign that onboarding choices shaped the feed (the spec's ✨ moment).
- **Refero searches:** `social feed empty state`, `feed error retry banner`,
  `personalized feed first run`, `Strava feed`.
- **Decide:** how to show "picked for you because you like Hiking" on the first
  session (a header chip row of chosen interests is the cheapest version).
