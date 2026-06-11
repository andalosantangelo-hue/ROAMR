# ROAMR — Firebase setup

Project: **roamr-55afb**. The web config is wired into `src/lib/firebase.js`.
Firestore + Storage are connected for Tribes (data + image upload). Do these
one-time steps in the Firebase console so the app can read/write.

## 1. Install + run
```bash
npm install        # pulls in firebase
npm run dev
```

## 2. Create the Firestore database
console.firebase.google.com → Build → **Firestore Database** → Create database →
Start in **test mode** → pick a location → Enable.

## 3. Enable Storage (for tribe images)
Build → **Storage** → Get started → **test mode** → Done.

> Test mode lets the app read/write for ~30 days with no login — perfect for
> building now. We'll lock it down with real rules once Auth is in (next step).

## 4. Try it
Open the app → Tribes tab → tap the green **+** → add a photo + name → Create.
The tribe is uploaded to Firestore, the image to Storage, and it appears at the
top of the list. Refresh the page — it's still there (now persisted).

## What's wired
- `src/lib/firebase.js` — app, Firestore (`db`), Storage, Auth, guarded Analytics.
- `src/store/TribesContext.jsx` — live `onSnapshot` read of the `tribes`
  collection; `addTribe()` uploads the image then writes the doc. Falls back to
  the local demo seed until the collection has real entries.

## Next (Auth — not done yet)
Enable sign-in providers under Build → Authentication → Sign-in method:
Email/Password, Google, Apple, Phone. Then the Login screen gets wired to real
sign-in and Firestore/Storage rules tighten to `request.auth != null`.
