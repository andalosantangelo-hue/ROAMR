# ROAMR — "App fixes before launch" pass: status

Senior-dev pass implementing the front-end edit list before the public link. Everything
below is built, wired into routing, and **ESLint-clean**. The full `vite` build/tests must
run on your Windows machine (the sandbox can't load Vite's native binary) — see "Verify".

## Done (in code, both working tree and GitHub clone)
- **Branding & capitalization** — splash logo, "Welcome Back", Title-Case names/headings app-wide.
- **18+ age gate** at sign-up (date of birth, must be 18+).
- **Dead links fixed** — real About, Help Center, and Guides screens; Membership back button; Premium waitlist; sign-out → Home.
- **Activity creation** — Location (+ "Use my location" GPS), Date & Time, Skill Level, "allow DMs" toggle. Shown on activity cards.
- **Tribes** — create with Location, Description, multi-activity tags; new **Tribe detail page** with **group chat** (members only).
- **Marketplace** — gear **Category** field + category filter; dedicated **ROAMR Apparel** tab with "Notify me at drop".
- **Direct messages** — Message button on any profile, **Messages** inbox, 1:1 chat threads.
- **Profile redesign** — photo-forward "Hinge-style" profile with location, interest chips, bio card, your own posts, and an Edit shortcut. Profile menu gains Messages.
- **Onboarding depth** — second step with subcategories per activity + a Beginner/Intermediate/Advanced skill level each.
- **Community filter** — funnel button on Activities (skill + location) and Tribes (activity + location) with a bottom-sheet.
- **Help Bot** — on-device "ROAMR Assistant" that answers common questions (Help Center → Ask the ROAMR Assistant).
- **Auth** — Google + Apple sign-in, password reset, and email verification are all wired in code.
- **Routing** — SPA rewrite already in firebase.json (fixes the "page downloads as HTML / blank on refresh" bug once on Hosting); every screen has a back path; unknown URLs redirect home.

## You must deploy for the new features to work
The new fields and the chat/DM collections need the updated **rules + indexes** live, or
writes get rejected. From `roamr-push/` (where you ran npm install), logged into Firebase:

```
firebase deploy --only firestore:rules,firestore:indexes
```

Then publish the site (this is the public link):
```
npm run build
firebase deploy --only hosting
```
Your URL: https://roamr-55afb.web.app

## Still account-side (needs your logins — not code)
- **Enable Google & Apple** providers in Firebase Console → Authentication → Sign-in method (Apple also needs an Apple Developer Services ID).
- **Seed demo data** so the link looks alive: see `SEED-DEMO-DATA.md` (one command).
- App Check enforcement (after deploy, once a reCAPTCHA key is set).

## Verify on your machine
```
npm run lint     # expect clean
npm run build    # must succeed before deploy
npm run test     # unit tests
```
