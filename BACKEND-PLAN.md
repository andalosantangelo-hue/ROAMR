# ROAMR — Backend Implementation Spec

Status: **planning / spec only** — no application code written yet.
Backend: **Firebase** (project `roamr-55afb`). Firestore + Storage + Auth.
Client: React 19 + Vite + Tailwind, wrapped with Capacitor (`com.roamr.app`).

This document is the source of truth for wiring a real backend behind **every**
feature, not just Tribes. Build order and decisions below are confirmed.

---

## 1. Current state (audit)

Firebase is initialized in `src/lib/firebase.js` (`db`, `storage`, `auth`,
guarded Analytics). **Only Tribes touches it today.** Everything else is
hardcoded seed data (`src/data/*.js`) or fake navigation.

Two structural gaps cut across the whole app:

- **No user identity.** Auth is imported but never called — Login just routes to
  Onboarding. There is no `uid` anywhere and no `users` collection. The
  new-tribe doc has no `ownerId`.
- **No persisted interactions.** Likes, saves, follows, and "Join" are all local
  `useState` — they reset on refresh.

### Feature → backend → status table

| Feature | Firestore collection(s) & key fields | Storage | Auth | Status |
|---|---|---|---|---|
| **Auth (Login)** | `users/{uid}`: displayName, email, photoURL, interests[], createdAt | — | **Required** (Email/Pwd, Google, Apple, Phone) | Not started (UI only, fake nav) |
| **Onboarding** | writes `users/{uid}.interests` | — | Required | Not started (selection discarded) |
| **Home / Newsfeed** | `posts/{id}` + `posts/{id}/likes/{uid}` + `posts/{id}/comments/{id}` + `users/{uid}/saves/{postId}` | post photos `posts/{uid}/…` | Required (read may be public) | Not started (`data/feed.js`) |
| **Activities** | `activities/{id}` + `activities/{id}/attendees/{uid}` | optional photo | Required to post/join | Not started (`data/activities.js`) |
| **Tribes** | `tribes/{id}`: name, img, members, createdAt (needs `ownerId`) | `tribes/…` image upload ✅ | currently none | **Done (data + image)** |
| **Tribe join / membership** | `tribes/{id}/members/{uid}`; derive `members` count | — | Required | Not started (Join is local state) |
| **Marketplace** | `listings/{id}`: sellerId, title, price, type, photos[], status, createdAt | `listings/…` photos | Required to list | Not started ("Coming soon") |
| **Premium / Membership** | `users/{uid}.subscription` (manual flag, MVP) | — | Required | Not started (hardcoded "Basic / Jan 2024") |
| **Profile** | reads `users/{uid}`; Edit writes it | avatar upload `avatars/{uid}` | Required | Not started (hardcoded "Susana Jones") |
| **Search** | client/Firestore queries over posts/activities/tribes/listings | — | — | Not started (dumb input) |
| **Follow** | `users/{uid}/following/{targetId}` + counts | — | Required | Not started (local state) |

---

## 2. Firestore data model

Field types use Firestore terms: `string`, `number`, `bool`, `timestamp`,
`array`, `map`, `geopoint`, `reference`. `serverTimestamp()` is used for all
`createdAt` / `updatedAt`. IDs are Firestore auto-IDs unless noted (`{uid}` =
Firebase Auth UID).

### `users/{uid}`
The root identity document, created/merged on first sign-in.

| Field | Type | Notes |
|---|---|---|
| `uid` | string | mirror of doc ID |
| `displayName` | string | from provider or Edit Profile |
| `email` | string | nullable for phone-only signups |
| `phoneNumber` | string | nullable |
| `photoURL` | string | provider photo or uploaded avatar |
| `interests` | array&lt;string&gt; | activity ids from Onboarding: `outdoor`, `water`, `wheel`, `nature`, `snow` |
| `bio` | string | optional |
| `subscription` | map | `{ tier: "basic" \| "premium", renewsAt: timestamp\|null, amount: number\|null, source: "manual" }` — **manual flag for MVP** |
| `followingCount` | number | denormalized counter |
| `followerCount` | number | denormalized counter |
| `createdAt` | timestamp | set once on create (merge must not overwrite) |
| `updatedAt` | timestamp | updated on profile edits |

#### `users/{uid}/saves/{postId}`
Bookmarked posts (Home "save" action).

| Field | Type | Notes |
|---|---|---|
| `postId` | string | mirror of doc ID |
| `collection` | string | `"posts"` or `"activities"` (what was saved) |
| `createdAt` | timestamp | |

#### `users/{uid}/following/{targetUid}`
Who this user follows.

| Field | Type | Notes |
|---|---|---|
| `targetUid` | string | mirror of doc ID |
| `createdAt` | timestamp | |

> Followers can be derived by collection-group query on `following` where
> `targetUid == me`, or mirrored into `users/{uid}/followers/{followerUid}` if
> reverse lookups get hot. MVP: rely on `followingCount` / `followerCount`
> counters updated client-side (later: Cloud Function for accuracy).

### `posts/{postId}`
Newsfeed entries (Home). Photo-based "I did this trip" posts.

| Field | Type | Notes |
|---|---|---|
| `authorId` | string | `users/{uid}` ref |
| `authorName` | string | denormalized for feed render |
| `authorPhotoURL` | string | denormalized |
| `title` | string | e.g. "Mt Daraitan + Tinipak River" |
| `location` | string | display string, e.g. "Mount Daraitan · Tanay" |
| `geo` | geopoint | optional, for future map/search |
| `photo` | string | Storage download URL |
| `rating` | number | 0–5 |
| `likeCount` | number | denormalized counter |
| `commentCount` | number | denormalized counter |
| `createdAt` | timestamp | feed ordered `desc` |

#### `posts/{postId}/likes/{uid}`
One doc per user who liked. Presence = liked.

| Field | Type | Notes |
|---|---|---|
| `uid` | string | mirror of doc ID |
| `createdAt` | timestamp | |

#### `posts/{postId}/comments/{commentId}`

| Field | Type | Notes |
|---|---|---|
| `authorId` | string | |
| `authorName` | string | denormalized |
| `authorPhotoURL` | string | denormalized |
| `text` | string | |
| `createdAt` | timestamp | ordered `asc` |

### `activities/{activityId}`
Event-style posts ("hike Mt Wilson Sunday 6 AM") that others can **Join**.

| Field | Type | Notes |
|---|---|---|
| `authorId` | string | |
| `authorName` | string | denormalized |
| `authorPhotoURL` | string | denormalized |
| `text` | string | the activity description |
| `photo` | string | optional Storage URL |
| `startsAt` | timestamp | when the activity happens |
| `attendeeCount` | number | denormalized counter |
| `likeCount` | number | |
| `commentCount` | number | |
| `createdAt` | timestamp | |

#### `activities/{activityId}/attendees/{uid}`
Presence = joined.

| Field | Type | Notes |
|---|---|---|
| `uid` | string | mirror of doc ID |
| `displayName` | string | denormalized for the avatar row |
| `photoURL` | string | denormalized |
| `createdAt` | timestamp | |

> `likes` and `comments` subcollections on `activities` follow the **same shape**
> as on `posts` if/when needed.

### `tribes/{tribeId}`
**Already live.** Existing docs: `name`, `img`, `members`, `joined`, `createdAt`.
Spec adds `ownerId` and moves membership to a subcollection (retrofit step).

| Field | Type | Notes |
|---|---|---|
| `name` | string | existing |
| `img` | string | existing — Storage download URL |
| `ownerId` | string | **new** — creator's uid |
| `memberCount` | number | **new** — replaces ad-hoc `members`; denormalized counter |
| `createdAt` | timestamp | existing |

> `members` (old numeric field) and `joined` (bool) are demo-seed leftovers.
> During the retrofit, `joined` is dropped (membership is now per-user) and
> `members` is superseded by `memberCount`.

#### `tribes/{tribeId}/members/{uid}`
Presence = joined. Drives `memberCount` and the Join button state.

| Field | Type | Notes |
|---|---|---|
| `uid` | string | mirror of doc ID |
| `role` | string | `"owner"` or `"member"` |
| `createdAt` | timestamp | |

### `listings/{listingId}`
Marketplace gear (rent or sell).

| Field | Type | Notes |
|---|---|---|
| `sellerId` | string | `users/{uid}` ref |
| `sellerName` | string | denormalized |
| `title` | string | |
| `description` | string | |
| `price` | number | in minor units or decimal — pick one and keep consistent |
| `currency` | string | e.g. `"PHP"` / `"USD"` |
| `type` | string | `"rent"` or `"sell"` |
| `photos` | array&lt;string&gt; | Storage download URLs |
| `tribeId` | string | optional — listed within a tribe |
| `status` | string | `"active"`, `"reserved"`, `"sold"` |
| `createdAt` | timestamp | |

---

## 3. Storage paths

All uploads go through Firebase Storage; the download URL is written back onto
the relevant Firestore doc.

| Upload type | Path pattern | Written to |
|---|---|---|
| Tribe image (live) | `tribes/{timestamp}-{filename}` | `tribes/{id}.img` |
| Post photo | `posts/{uid}/{timestamp}-{filename}` | `posts/{id}.photo` |
| Activity photo | `activities/{uid}/{timestamp}-{filename}` | `activities/{id}.photo` |
| Listing photos | `listings/{uid}/{listingId}/{timestamp}-{filename}` | `listings/{id}.photos[]` |
| User avatar | `avatars/{uid}/{timestamp}-{filename}` | `users/{uid}.photoURL` |

> Existing tribe path (`tribes/{ts}-{name}`) stays as-is for compatibility.
> New paths are namespaced by `{uid}` so Storage rules can enforce owner-only
> writes cleanly.

---

## 4. Auth setup

### Providers (enable in Firebase console → Authentication → Sign-in method)
- **Email / Password**
- **Google**
- **Apple** (required for App Store when other social logins exist)
- **Phone** (SMS)

On Capacitor/native, Google and Apple sign-in use native flows; the web build
uses Firebase popup/redirect. This is a wiring detail for the implementation
step, noted here so providers are enabled up front.

### Auth context + route guards
- Add an `AuthProvider` (e.g. `src/store/AuthContext.jsx`) that subscribes to
  `onAuthStateChanged` and exposes `{ user, loading, signIn*, signOut }`.
- Mount it above `TribesProvider` in `App.jsx`.
- Add a `RequireAuth` wrapper around the `/app/*` and `/create-tribe` routes:
  - `loading` → splash/spinner,
  - no user → redirect to `/login`,
  - user present → render.
- `/`, `/login`, `/onboarding` stay public.

### User-doc create / merge on first sign-in
On every successful sign-in, write `users/{uid}` with
`setDoc(ref, {...}, { merge: true })`:
- Always merge: `displayName`, `email`, `phoneNumber`, `photoURL`, `updatedAt`.
- Set **only if missing**: `createdAt`, `interests: []`,
  `subscription: { tier: "basic", source: "manual", renewsAt: null, amount: null }`,
  `followingCount: 0`, `followerCount: 0`.
- Use merge so re-logins never clobber Onboarding interests or profile edits.

---

## 5. Security rules strategy

Today both Firestore and Storage are in **test mode** (open read/write, ~30-day
expiry) per `FIREBASE-SETUP.md`. We tighten **per collection as each one goes
live**, not all at the end — so every feature ships behind real rules.

Baseline once Auth lands:

```
// Firestore — illustrative shape, not final code
match /users/{uid} {
  allow read: if request.auth != null;
  allow write: if request.auth.uid == uid;            // owner-only
}
match /posts/{postId} {
  allow read: if true;                                 // public feed (or auth-only)
  allow create: if request.auth.uid == request.resource.data.authorId;
  allow update, delete: if request.auth.uid == resource.data.authorId;
  match /likes/{uid} {
    allow write: if request.auth.uid == uid;           // like only as yourself
  }
  match /comments/{cid} {
    allow create: if request.auth.uid == request.resource.data.authorId;
    allow update, delete: if request.auth.uid == resource.data.authorId;
  }
}
match /activities/{id} { /* same pattern as posts */ }
match /tribes/{id} {
  allow read: if true;
  allow create: if request.auth.uid == request.resource.data.ownerId;
  allow update, delete: if request.auth.uid == resource.data.ownerId;
  match /members/{uid} {
    allow write: if request.auth.uid == uid;           // join/leave as yourself
  }
}
match /listings/{id} {
  allow read: if true;
  allow create: if request.auth.uid == request.resource.data.sellerId;
  allow update, delete: if request.auth.uid == resource.data.sellerId;
}
```

Storage rules mirror this: a user may write only under paths namespaced by their
own `{uid}` (`posts/{uid}/…`, `avatars/{uid}/…`, etc.); reads public or
auth-gated per asset type.

Rollout rule of thumb: **the rules for a collection ship in the same step that
wires that collection to the client.** Denormalized counters
(`likeCount`, `memberCount`, …) are updated client-side for MVP; if integrity
matters later, move them to Cloud Functions / triggers.

---

## 6. Build order

Each step delivers a shippable slice and ships its own security rules.

1. **Auth + `users` doc** — the foundation everything hangs off.
   Delivers: working Login (Email/Pwd, Google, Apple, Phone), `AuthProvider`,
   `RequireAuth` route guards, create/merge `users/{uid}` on first sign-in,
   `users` + base Storage rules.
2. **Onboarding → user profile** — persist selected `interests` to
   `users/{uid}`. Small, validates the authenticated write path.
3. **Profile + Premium read** — Profile shows the real signed-in user; Edit
   Profile writes `users/{uid}` (+ avatar upload to `avatars/{uid}`); Premium
   reads `users/{uid}.subscription` (manual flag). No billing integration.
4. **Retrofit Tribes to auth** — add `ownerId` on create, introduce
   `tribes/{id}/members/{uid}`, persist Join/Leave, derive `memberCount`,
   tighten tribe rules. Smallest delta since data + image upload already work.
5. **Posts (Home) + Activities** — the largest pieces. `posts` and `activities`
   collections, real likes / comments / saves, attendee join, create flows,
   photo upload. Mirror the existing `TribesContext` pattern.
6. **Marketplace** — net-new feature: `listings` collection + multi-photo gear
   upload, list/browse, status.
7. **Search** — once collections exist. Start with simple Firestore queries over
   posts/activities/tribes/listings; add Algolia only if query needs outgrow
   Firestore.
8. **Security rules hardening pass** — final review across all collections,
   remove any remaining test-mode allowances, confirm owner-only writes and
   Storage path scoping.

---

## 7. Decisions locked for MVP

- **Premium = manual flag.** `users/{uid}.subscription.tier` set to
  `"premium"` by hand (console/admin); no Stripe/IAP integration in MVP. The
  Premium screen reads this field; "Upgrade" can be a no-op or a waitlist for now.
- **Counters denormalized client-side** (likes, members, attendees, follows).
  Cloud Functions deferred until accuracy/abuse becomes a real concern.
- **Build order as listed above**, security rules rolled out per collection.

---

## 8. Experience & Polish Principles

These are the build rules we hold **every feature** to. They turn the data model
in sections 2–5 into something that feels premium yet simple. Each principle is
tied to the specific backend primitive that makes it possible.

**North-star translation (look-and-feel inspiration, not content):**
- **AllTrails** — discovery + saved lists that feel effortless; rich cards, "Save"
  to a personal collection. → our `users/{uid}/saves` subcollection + designed
  discovery cards.
- **Strava** — a social feed where lightweight reactions (kudos) and comments
  carry the community. → our `posts` feed + `likes`/`comments` subcollections,
  optimistic "kudos-style" Like.
- **Meetup** — RSVP to events and join groups; "you're going" clarity. → our
  `activities` + `attendees` and `tribes` + `members`.
- **onX Maps** — clean, honest premium gating; free core, premium layers without
  nagging. → our `users/{uid}.subscription` flag gates premium UI politely.

> ROAMR has **no GPS tracking, maps, or trail database** today. Where a
> north-star pattern needs those, we flag it under *Future enhancements* (§8.7)
> rather than assume we'll build it.

### 8.1 Optimistic UI
Taps on **Like, Join, Save, Follow** must respond instantly, sync in the
background, and roll back on failure.

- **Pattern:** update local state the instant the user taps → write to Firestore
  → on error, revert local state and show a quiet toast.
- **Backed by:** these actions are all *presence docs* in subcollections
  (`posts/{id}/likes/{uid}`, `activities/{id}/attendees/{uid}`,
  `tribes/{id}/members/{uid}`, `users/{uid}/following/{targetUid}`) — a single
  `setDoc`/`deleteDoc` keyed by `uid`, which is idempotent and trivially
  reversible. Denormalized counters (`likeCount`, `attendeeCount`, `memberCount`)
  are bumped optimistically alongside, then reconciled by the `onSnapshot`
  stream.
- **Rule:** never block the UI on a network round-trip for a single-tap action.

### 8.2 Real-time via `onSnapshot`
Feeds, tribes, and activities update live without a manual refresh.

- **Pattern:** screens subscribe with `onSnapshot` (as `TribesContext` already
  does) and render from the live snapshot; unsubscribe on unmount.
- **Backed by:** `posts`, `activities`, `tribes`, `listings` are all top-level
  collections ordered by `createdAt desc` — directly streamable. A new post or a
  friend joining your activity appears for everyone watching, no polling.
- **Rule:** list screens read from a live subscription, not a one-shot `getDocs`,
  unless pagination requires it (see §8.6).

### 8.3 Frictionless first 60 seconds
The path from launch to a populated, personal feed is the make-or-break moment.

- **Multi-provider sign-in:** Email/Pwd, Google, Apple, Phone (per §4) — one
  clean screen, no forced password creation for social/phone.
- **Onboarding that shapes the feed:** interests selected in Onboarding persist
  to `users/{uid}.interests` and are used to order/filter the first feed — so the
  choice visibly *did something*. (MVP: client-side filter/boost of `posts` and
  `activities` by interest tags; later: server-side ranking.)
- **Never a blank screen:** every async surface ships three states —
  **skeleton loader** while the snapshot resolves, **designed empty state** with
  a clear CTA when a collection is genuinely empty, and the populated state.
- **Backed by:** `merge`-on-first-sign-in (§4) guarantees a `users/{uid}` doc
  exists immediately, so Profile/Premium/feed never hit a missing-doc blank.

### 8.4 One clear primary action per screen
Each screen has a single, obvious "do this next."

- Splash → **Get Started**; Login → **Continue**; Onboarding → **Continue**;
  Home → **create a post** (FAB); Activities → **create / Join**; Tribes →
  **create (+) / Join**; Marketplace → **list gear**; Profile → **Edit Profile**;
  Premium → **Upgrade** (or waitlist, MVP).
- **Rule:** secondary actions never compete visually with the primary CTA. The
  FAB / primary button maps to exactly one write path in the data model.

### 8.5 Delight
Small, consistent moments that make it feel native and alive.

- **Smooth transitions** between routes and into create flows.
- **Native haptics** via Capacitor (`@capacitor/haptics`, to add) on Like, Join,
  Save, and successful Create — a light tap of confirmation.
- **Satisfying create flows:** the existing Create Tribe flow (photo picker →
  name → instant appearance at top of the live list) is the template; reuse it
  for posts, activities, and listings.
- **Pull-to-refresh** on feed/list screens (re-warms the subscription / fetches
  newest page).
- **Backed by:** optimistic writes (§8.1) + `onSnapshot` (§8.2) are what make a
  create feel instant — the new doc streams back to the top of the list on its
  own, so the "reward" is real, not faked.

### 8.6 Performance budgets
It must stay fast as data grows.

- **Pagination:** feed and list screens use `orderBy('createdAt','desc')` +
  `limit(n)` (start n≈10–15) with cursor paging (`startAfter`) on scroll. Live
  `onSnapshot` covers the first page; older pages load on demand.
- **Counters over aggregation:** read denormalized `likeCount` /
  `commentCount` / `attendeeCount` / `memberCount` from the parent doc — never
  load a whole subcollection just to show a number.
- **Image sizing & lazy-load:** uploads are resized client-side before going to
  Storage; feed images use `loading="lazy"` (already in `PostCard`) and request
  width-appropriate variants. Avatars stay small.
- **Denormalized author fields:** `authorName` / `authorPhotoURL` are stored on
  each post/activity so the feed renders without an N+1 fan-out of `users` reads.
- **Targets:** time-to-first-meaningful-paint on the feed under a couple of
  seconds on mid-tier mobile; a single tap action visibly resolves in <100ms
  (optimistic), with Firestore confirming behind it.

### 8.7 Future enhancements (decision needed)
North-star patterns that would require **net-new capability** beyond the current
spec. None are assumed — each is a deliberate decision:

- **onX / AllTrails-style live maps & trail database** — interactive map, map
  layers, a searchable catalog of trails/parks. Needs a maps SDK + a trails data
  source/licensing. **Not in current model.**
- **Strava-style route recording / GPS tracking** — record a hike/ride track,
  distance/elevation stats. Needs device GPS capture (`@capacitor/geolocation`),
  a `tracks` collection, and route storage/rendering. **Not in current model.**
- **Location-aware discovery** — "activities/tribes near me." Needs geo storage
  (the optional `geo` geopoint on `posts`) + geohash querying. Partially
  anticipated, not wired.
- **Premium feature set** — which capabilities sit behind `subscription.tier`
  (e.g. advanced filters, unlimited saves, map layers if added). The flag exists;
  the gated feature list is a product decision.
- **Server-side feed ranking & counter integrity** — Cloud Functions for
  interest-based ranking and tamper-proof counters (§5 notes client-side for
  MVP).

---

## 9. Launch Readiness & Polish

Sections 2–8 get the features working. This section turns the gap between
"works on my phone" and "passes App Store / Play review and feels like a top-10
app" into concrete, planned work — tied to the same Firebase backend
(`roamr-55afb`) and Capacitor shell (`com.roamr.app`).

Every item is tagged **Blocker** (review will reject the build without it),
**High** (needed for a top-10 feel, not for approval), or **Later** (real, but
deferrable past first ship).

### 9.A App Store / Play ship-blockers

#### 9.A.1 In-app account deletion — **Blocker**
Apple **Guideline 5.1.1(v)** requires any app with account creation to let the
user delete their account *from inside the app* — not just deactivate, and not
"email us." Google has the same requirement (Play Console "Data deletion" +
in-app path).

A "Delete account" entry lives at the bottom of **Profile → Settings**, behind a
confirm dialog ("This permanently deletes your account and content. This can't
be undone."). On confirm we run a teardown over everything keyed to the `uid`:

| Step | What | How |
|---|---|---|
| 1 | Delete the user's owned content | Query + `deleteDoc` their `posts`, `activities`, `listings`; delete owned `tribes` (or transfer/tombstone — see note) |
| 2 | Delete presence docs they created elsewhere | their `likes/{uid}`, `attendees/{uid}`, `members/{uid}` across docs; their `following` + counters on people they followed |
| 3 | Delete Storage objects | everything under `posts/{uid}/`, `activities/{uid}/`, `listings/{uid}/`, `avatars/{uid}/` (paths are already `uid`-namespaced per §3 — makes this a clean prefix delete) |
| 4 | Delete `users/{uid}` + subcollections | `saves`, `following`, then the root doc |
| 5 | Delete the Auth user | `deleteUser(auth.currentUser)` — last, so failures don't orphan the auth record |

`deleteUser` throws `auth/requires-recent-login` if the session is stale; catch
it, force a re-auth (`reauthenticateWithCredential` / provider re-prompt), then
retry step 5.

> **MVP shortcut that's still compliant:** client-side teardown of the above is
> acceptable for first ship since paths/docs are all `uid`-keyed and the set is
> small. The risk is a partial delete if the app is killed mid-teardown. The
> robust version is a Cloud Function (`onDelete` of the auth user, or a callable)
> that does the fan-out server-side — bundle it with §9.B since that's when
> Functions land anyway. **Owned tribes with other members** need a product
> call: tombstone the tribe ("creator left") rather than nuking other people's
> membership. Tag: deletion **Blocker**; server-side hardening **High**.

#### 9.A.2 Email/Password account lifecycle — **Blocker**
§4 enables the Email/Password provider but only covers sign-in. Review (and
basic usability) needs the full lifecycle wired:

- **Sign-out** — `signOut(auth)` from Profile/Settings; clears the
  `AuthProvider` user and `RequireAuth` (§4) bounces to `/login`. **Blocker**
  (there's currently no way out of a session).
- **Password reset** — "Forgot password?" on Login → `sendPasswordResetEmail`.
  Uses Firebase's hosted reset flow for MVP (no custom action handler page).
  **Blocker** for the Email/Password provider.
- **Email verification** — on Email/Password sign-up, call
  `sendEmailVerification`; surface a non-blocking "Verify your email" banner that
  reads `auth.currentUser.emailVerified`. Gate nothing on it for MVP (don't lock
  users out), just prompt. **High.**

Social/phone providers (Google, Apple, Phone) don't need reset/verification —
the provider owns the credential.

#### 9.A.3 Content moderation: report + block — **Blocker**
Apple **Guideline 1.2** requires that any app with user-generated content have:
a way to **report** objectionable content, a way to **block** abusive users, a
mechanism to **filter** objectionable content, and a published path for the
developer to **act on reports** (with a stated response time, commonly 24h).
ROAMR has UGC across posts, activities, tribes, listings, comments, and profiles
— this is non-negotiable for submission.

**Firestore shape:**

```
// A single global reports queue — one doc per report
reports/{reportId}
  reporterId:   string      // users/{uid}
  targetType:   string      // "post" | "activity" | "tribe" | "listing" | "comment" | "user"
  targetId:     string      // doc id of the reported thing
  targetOwnerId:string      // uid of who created it (denormalized, for triage)
  reason:       string      // "spam" | "harassment" | "nudity" | "other"
  note:         string      // optional free text
  status:       string      // "open" | "reviewed" | "actioned" | "dismissed"
  createdAt:    timestamp

// Per-user block list — presence doc, same pattern as following (§2)
users/{uid}/blocked/{targetUid}
  targetUid:    string      // mirror of doc id
  createdAt:    timestamp
```

Rules: `reports` is `create`-only for any authed user (`reporterId == auth.uid`),
no client read/update (review happens in the console). `users/{uid}/blocked/*`
is owner-only write, same as `following`.

**Client-side filtering (the "filter objectionable content" requirement):**
- Load the signed-in user's `blocked` set once into the `AuthProvider` (it's
  small). Filter it into every feed/list `onSnapshot` render — drop posts,
  activities, comments, listings, and tribe content whose `authorId` /
  `sellerId` / `ownerId` is in the blocked set. Firestore has no "not-in a
  subcollection" query, so this is a client-side `.filter()` over the live
  snapshot (consistent with §8.2). Cheap at MVP scale.
- **Report** is a menu item ("⋯ → Report") on every UGC card and on profiles;
  **Block** sits on profiles and in the same overflow menu. Blocking also offers
  "and report."

**Minimal review path (the "act on reports" requirement):** for MVP, the
`reports` collection *is* the queue — triaged by hand in the Firebase console,
sorted by `status == "open"`, `createdAt asc`. Actioning = deleting the offending
doc (owner-only rules don't block an admin in the console) and setting
`status`. Publish a contact email + 24h-response commitment in the Privacy
Policy / Terms (§9.A.4) and the store listing. A real moderation dashboard /
auto-takedown-on-N-reports is **Later** (Cloud Function territory, pairs with
§9.B). Tag: report + block + filter **Blocker**; dashboard/automation **Later**.

#### 9.A.4 Privacy Policy, Terms of Service, permission strings — **Blocker**
- **Privacy Policy + Terms of Service** — both stores require a reachable Privacy
  Policy URL; UGC + accounts effectively require Terms (and an EULA / "no
  tolerance for objectionable content" clause that Apple 1.2 looks for). Host
  two static pages (can live on the existing ROAMR marketing site) and link them
  from **Profile → Settings** and from the sign-up screen ("By continuing you
  agree to…"). The Privacy Policy must disclose Firebase (Google) as a data
  processor, what's collected (email, photos, content, FCM token per §9.B,
  analytics per §9.C), and the account-deletion path (§9.A.1). **Blocker.**
- **iOS `Info.plist` permission strings** — the existing image-upload flows
  (tribe image is live; post/activity/listing/avatar per §3) trigger the iOS
  photo picker / camera, and iOS **crashes** the app on first access if the usage
  string is missing. Add to `ios/App/App/Info.plist`:

  ```xml
  <key>NSPhotoLibraryUsageDescription</key>
  <string>ROAMR needs access to your photos so you can add images to posts,
  activities, listings, and your profile.</string>
  <key>NSCameraUsageDescription</key>
  <string>ROAMR needs camera access so you can take photos for your posts,
  activities, and listings.</string>
  ```

  Add `NSPhotoLibraryAddUsageDescription` only if we add a "save to camera roll"
  feature (not in scope). On Android, `READ_MEDIA_IMAGES` (API 33+) is handled by
  the Capacitor Camera plugin's manifest merge — verify it's present. **Blocker.**

#### 9.A.5 App icon, splash, store listing assets (Capacitor) — **Blocker**
Generated and configured through the Capacitor toolchain, not hand-built:

- **Icon + splash** — drop a 1024×1024 `icon.png` (and a splash source) into the
  project and run `@capacitor/assets` (`npx capacitor-assets generate`) to emit
  every iOS/Android density. Configure splash behavior + background color via
  `@capacitor/splash-screen` in `capacitor.config`. **Blocker** (default
  Capacitor icon = instant reject / unshippable).
- **Store listing checklist** — App Store: 1024×1024 marketing icon, 6.7" + 6.5"
  (and 5.5" if targeting older) iPhone screenshots, name/subtitle/description/
  keywords, support URL, Privacy Policy URL, **App Privacy "nutrition label"**
  (declare email, photos, user content, identifiers, usage data → Firebase).
  Play: 512×512 icon, feature graphic (1024×500), phone screenshots, short +
  full description, and the **Data Safety form** (mirrors the iOS privacy
  label). Bundle id `com.roamr.app` already set. **Blocker.**

### 9.B Push notifications — **High** (introduces Cloud Functions)

> ⚠️ **This is the first server-side code in the project.** Everything to date is
> client + security rules (§5 explicitly defers Functions). Sending a push
> *reliably* on a data change has to happen server-side — you can't trust clients
> to notify each other. Standing up Cloud Functions also unlocks the hardened
> versions of §9.A.1 (deletion) and §9.A.3 (moderation), so plan the Functions
> environment once and reuse it.

Stack: **Firebase Cloud Messaging (FCM)** + **`@capacitor/push-notifications`**
(native APNs/FCM registration) on device; **Cloud Functions** (Firestore
triggers) as the sender. On iOS this also requires an **APNs auth key uploaded
to Firebase** and the **Push Notifications capability** + background mode in the
Xcode project.

**Token storage** — on permission grant, the device registers and we store the
FCM token on the user doc:

```
users/{uid}
  fcmTokens:  array<string>   // device tokens; a user can have several devices
  notificationPrefs: map {    // all default true; toggled in Settings
    kudos:        bool,        // someone liked/kudos'd your post
    comments:     bool,        // someone commented on your post/activity
    activityJoin: bool,        // someone joined your activity
    tribeMember:  bool,        // new member in a tribe you own
    newFollower:  bool         // someone followed you
  }
```

Use `arrayUnion`/`arrayRemove` to keep `fcmTokens` clean; prune tokens FCM
reports as unregistered on send.

**Triggers (Cloud Functions on Firestore writes) → recipient:**

| Event | Trigger | Notifies | Pref key |
|---|---|---|---|
| Kudos / like on your post | `onCreate posts/{id}/likes/{uid}` | post `authorId` | `kudos` |
| Comment on your post/activity | `onCreate .../comments/{id}` | the parent's `authorId` | `comments` |
| Someone joins your activity | `onCreate activities/{id}/attendees/{uid}` | activity `authorId` | `activityJoin` |
| New member in your tribe | `onCreate tribes/{id}/members/{uid}` | tribe `ownerId` | `tribeMember` |
| New follower | `onCreate users/{uid}/following/{targetUid}` | `targetUid` | `newFollower` |

Each function: resolve the recipient, **skip if recipient == actor** (don't
notify yourself), check `notificationPrefs[key]`, read `fcmTokens`, and
`messaging().sendEachForMulticast(...)`. Denormalized actor fields already on
the presence/comment docs (§2) give us the "Ana liked your post" copy without an
extra read.

Optionally persist a `users/{uid}/notifications/{id}` doc per send to power an
in-app notification inbox — **Later**. Permission priming (ask *after* the user
has done something, not on first launch) is a **High** UX detail.

### 9.C Engagement & reliability essentials

#### 9.C.1 Cold-start / content seeding — **Blocker (perceived)**
A brand-new app with zero users and zero posts feels broken on launch day —
this is a soft blocker on it being *worth* shipping, even if review passes.

- **Seed real content** before launch: a handful of `tribes` already exist
  (demo seed, §2); add genuine starter `activities` and `posts` from the
  founding team's actual outdoor trips so the feed is alive on first open.
- **Suggested people** — since `posts`/`activities` carry denormalized author
  fields, a simple "people to follow" rail can surface seeded authors; full
  follow-suggestion ranking is **Later**.
- **Designed empty states** — cross-ref **§8.3** ("never a blank screen"): every
  surface that *can* be empty for a new user (their own feed before they follow
  anyone, a tribe with no listings, search with no results) gets a designed empty
  state with a clear CTA, not a void. This is the difference between "new" and
  "dead."

Tag: seeding + empty states **Blocker (perceived)**; suggested-people ranking
**Later**.

#### 9.C.2 Firestore offline persistence — **High**
ROAMR is an *outdoor* app — signal drops on trails. Enable offline persistence so
cached feeds/tribes render and writes queue while offline, syncing on reconnect.

- On native (Capacitor) the Firestore SDK persists by default; on web,
  initialize with `persistentLocalCache` (`persistentMultipleTabManager`).
  Verify it's on in `src/lib/firebase.js`.
- Optimistic writes (§8.1) already align with this — a queued offline write and
  an optimistic UI update look the same to the user.
- Surface a lightweight **offline banner** (Capacitor `@capacitor/network`) so a
  stale feed is honest about being stale. **High.**

#### 9.C.3 Analytics funnels — **High**
Firebase Analytics is already initialized (guarded, per §1). Instrument the
funnels that tell us whether the §8.3 "first 60 seconds" actually works:

- **Activation funnel:** `app_open → sign_up (method) → onboarding_complete
  (interest count) → first_feed_view → first_interaction (like/join/follow)`.
- **Creation funnel:** `create_start (type) → media_picked → create_success`
  for posts/activities/tribes/listings — to see where create flows leak.
- **Engagement events:** `post_like`, `activity_join`, `tribe_join`, `follow`,
  `search`, `listing_view`, `report_submit`, `block_user`.
- Set `user_properties` for `interests` and `subscription.tier` so funnels can be
  sliced by segment. Keep event names stable from day one — renaming later breaks
  historical funnels.

#### 9.C.4 Crash reporting — **High**
Ship blind without this and you can't tell a successful launch from a crashing
one. Use **Firebase Crashlytics** (stays in the Firebase console alongside
Analytics; native via Capacitor community plugin or the native SDK in the
iOS/Android projects). **Sentry** (`@sentry/capacitor`) is the alternative if we
want JS-layer error capture + source maps for the React code, which Crashlytics
handles less gracefully. Recommendation: **Crashlytics** for native crash
coverage now; revisit Sentry if JS-error visibility becomes the bottleneck.
Wire it to log the `uid` (not PII) for crash-to-user correlation.

#### 9.C.5 Auth edge cases: provider linking & duplicate email — **High**
§4 enables four providers against one `users/{uid}`; that creates collisions the
happy path ignores:

- **Duplicate email across providers.** With Firebase's default "one account per
  email," a user who signed up with Email/Password and later taps "Sign in with
  Google" (same email) hits `auth/account-exists-with-different-credential`.
  Handle it: fetch sign-in methods for the email, prompt them to sign in with the
  original provider, then **link** the new credential
  (`linkWithCredential`). Without this, the second attempt just errors and looks
  broken.
- **Apple "Hide My Email"** returns a relay address and only returns the user's
  name **once**, on first authorization — capture `displayName` on that first
  callback or it's lost forever. The merge-on-sign-in (§4) must not overwrite a
  good `displayName`/`email` with a later null from a re-auth.
- **Phone-only accounts** have null `email` (already allowed in the §2 schema) —
  make sure Profile, deletion (§9.A.1), and notifications don't assume an email
  exists.

### 9.D Priority rollup

**Blockers (must clear before submitting to either store):** in-app account
deletion (9.A.1), sign-out + password reset (9.A.2), report/block/filter +
review path (9.A.3), Privacy Policy + Terms + Info.plist permission strings
(9.A.4), app icon + splash + store listing & privacy labels (9.A.5). Plus the
perceived blocker: content seeding + designed empty states (9.C.1).

**High (top-10 feel, fast-follow if needed):** email verification (9.A.2), push
notifications + Cloud Functions (9.B), offline persistence + offline banner
(9.C.2), analytics funnels (9.C.3), crash reporting (9.C.4), auth
linking/duplicate-email handling (9.C.5).

**Later (real, deferrable):** server-side deletion/moderation hardening via
Cloud Functions (9.A.1, 9.A.3), in-app notification inbox + follow-suggestion
ranking (9.B, 9.C.1).

> **Sequencing note:** the Blockers are mostly client + config work and slot in
> after the §6 build order completes (they need the features to exist first).
> The biggest single lift is **9.B**, which stands up Cloud Functions for the
> first time — once that environment exists, fold in the hardened server-side
> versions of account deletion (9.A.1) and moderation actioning (9.A.3) rather
> than building them client-only twice.
