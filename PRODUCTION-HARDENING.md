# ROAMR — Production hardening (security · scale · reliability)

Done in this pass so the app is safe and fast for hundreds of thousands of users.

## Security
- **Locked security rules** (`firestore.rules`, `storage.rules`) — replaces test mode.
  Least-privilege per collection: signed-in reads; create requires the caller to
  own the `authorId`/`ownerId`/`sellerId`/`reporterId`; update/delete owner-only.
  Counts can't be set on create (must be 0) and `users` counters/`subscription`
  are blocked from client writes. `reports` is create-only (no client read).
  Storage writes are owner-namespaced and limited to images < 10 MB.
- **APPLY THESE:** `firebase deploy --only firestore:rules,storage` (and
  `firestore:indexes`). They are wired in `firebase.json`.

## Integrity at scale (tamper-proof counters)
- All denormalized counters — `likeCount`, `commentCount`, `attendeeCount`,
  `memberCount`, `followerCount`/`followingCount` — and `activities.recentAttendees`
  are now maintained ONLY by Cloud Functions (`functions/index.js`), on
  presence-doc create/delete. Clients can no longer write them (rules enforce it),
  so counts can't be inflated. `recentAttendees` is capped at 8 and keyed by `uid`
  (no unbounded array growth, no stale entries).
- Optimistic UI still flips instantly (heart/Joined); the number reconciles from
  the server a beat later — correct and un-gameable.

## Performance
- **Declared indexes** (`firestore.indexes.json`): listings `status + createdAt`
  composite, and collection-group indexes for `members`/`likes`/`attendees` on
  `uid` — deploy them so queries are fast and don't need manual console clicks.
- Bounded listeners: feeds `limit(20)`, tribes `limit(50)`, listings `limit(30)`.
  (Cursor pagination is the next step if lists grow past a page.)
- Like collection-group queries are now scoped to the correct collection (posts vs
  activities) — fixes cross-feed like state and halves the per-user read.

## Reliability
- **Account deletion** now fans out: removes the user's likes/attendees/members
  (so Functions decrement counts), their following/saves/blocked, their owned
  posts/activities/listings/tribes, the user doc, then the auth user. (The fully
  robust version is a Cloud Function — see below.)
- Listing status changes roll back on failure; report/block menu hidden on demo
  cards; push token bound to the active user (no cross-account leak).

## Still recommended before/after launch
- Move account-deletion + report-actioning to **Cloud Functions** (server-side
  fan-out) once Blaze is on — more robust than client teardown if the app is
  killed mid-delete. Tombstone owned tribes that have other members.
- Add cursor pagination to feeds as data grows (BACKEND-PLAN §8.6).
- Crashlytics (§9.C.4) for crash visibility on device.
