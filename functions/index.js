// ROAMR Cloud Functions (BACKEND-PLAN §9.B + counter integrity + abuse rate limiting).
// Server-authoritative counters (tamper-proof) + push notifications + per-user rate limits.
// Deploy: `firebase deploy --only functions` (Blaze plan).
const {
  onDocumentCreated, onDocumentCreatedWithAuthContext, onDocumentDeleted, onDocumentUpdated,
} = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const logger = require("firebase-functions/logger");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");
const { getAuth } = require("firebase-admin/auth");
const { getStorage } = require("firebase-admin/storage");

initializeApp();
const db = getFirestore();

// Caps runaway scaling (and runaway bills) if a trigger is ever flooded.
setGlobalOptions({ maxInstances: 100 });

const bump = (path, field, n) =>
  db.doc(path).update({ [field]: FieldValue.increment(n) })
    .catch((err) => { if (err.code !== 5) logger.warn("bump failed", { path, field, err: err.message }); }); // 5 = NOT_FOUND (parent deleted)

/* Firestore triggers are delivered at-least-once, so a retried event used to apply
 * its counter change twice. Each counter trigger now claims its event id first; a
 * duplicate delivery finds the claim and does nothing. Claims expire via TTL policy
 * on processedEvents.expireAt (configure in the console: Firestore → TTL). */
async function once(e, fn) {
  const ref = db.doc(`processedEvents/${e.id}`);
  try {
    await ref.create({ expireAt: new Date(Date.now() + 7 * 864e5) });
  } catch (err) {
    if (err.code === 6) return; // ALREADY_EXISTS → duplicate delivery
    logger.warn("event claim failed; processing anyway", { id: e.id, err: err.message });
  }
  return fn();
}

/* ------------------------------------------------------------------ *
 * Abuse rate limiting (server-authoritative).
 * A logged-in client can call the SDK directly, so per-user spam limits
 * must live server-side. Each rate-limited create increments a fixed-window
 * counter in rateLimits/{uid}; over-limit docs are deleted.
 * Thresholds are deliberately generous — they stop scripted spam, not humans.
 * ------------------------------------------------------------------ */
const RL = {
  post:     { max: 40,  windowSec: 3600 },   // 40 posts / hour
  activity: { max: 40,  windowSec: 3600 },   // 40 activities / hour
  listing:  { max: 25,  windowSec: 3600 },   // 25 listings / hour
  tribe:    { max: 15,  windowSec: 3600 },   // 15 tribes / hour
  comment:  { max: 80,  windowSec: 3600 },   // 80 comments / hour
  report:   { max: 25,  windowSec: 86400 },  // 25 reports / day
  follow:   { max: 250, windowSec: 3600 },   // 250 follows / hour
  message:  { max: 120, windowSec: 3600 },   // 120 chat messages / hour
  thread:   { max: 30,  windowSec: 86400 },  // 30 new DM conversations / day
};

// Returns true if the action is within the user's limit. Each action gets its own
// doc so one busy action can't contend with another. A transaction that keeps
// failing under a burst is now treated as OVER the limit (it used to fail open, so
// a parallel burst could bypass the limiter entirely).
async function allow(uid, action) {
  if (!uid) return true;
  const cfg = RL[action];
  if (!cfg) return true;
  const ref = db.doc(`rateLimits/${uid}_${action}`);
  try {
    return await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const now = Date.now();
      const winStart = now - cfg.windowSec * 1000;
      const data = snap.exists ? snap.data() : {};
      let count = data.count || 0;
      let start = data.start || now;
      if (start < winStart) { count = 0; start = now; } // window rolled over
      count += 1;
      tx.set(ref, { count, start, updatedAt: now });
      return count <= cfg.max;
    }, { maxAttempts: 8 });
  } catch (err) {
    logger.warn("rate limiter contention; treating as over limit", { uid, action, err: err.message });
    return false;
  }
}

// Record an abuse trip for monitoring (server-only collection; best-effort).
async function flag(uid, action, ref) {
  try {
    await db.collection("abuseFlags").add({
      uid: uid || null, action, path: ref ? ref.path : null,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (err) { logger.warn("flag failed", { err: err.message }); }
}

async function notify(recipientUid, actorUid, prefKey, title, body, data = {}) {
  if (!recipientUid || recipientUid === actorUid) return;
  const snap = await db.doc(`users/${recipientUid}/private/data`).get();
  if (!snap.exists) return;
  const u = snap.data();
  if ((u.notificationPrefs || {})[prefKey] === false) return;
  const tokens = (u.fcmTokens || []).slice(0, 10);
  if (!tokens.length) return;
  const res = await getMessaging().sendEachForMulticast({ tokens, notification: { title, body }, data });
  const bad = [];
  res.responses.forEach((r, i) => {
    const code = r.error && r.error.code;
    if (!r.success && (code === "messaging/registration-token-not-registered" || code === "messaging/invalid-registration-token")) bad.push(tokens[i]);
  });
  if (bad.length) await snap.ref.update({ fcmTokens: FieldValue.arrayRemove(...bad) });
}

// In-app notification inbox doc (written regardless of push prefs/tokens).
async function record(recipientUid, actorUid, type, text, link) {
  if (!recipientUid || recipientUid === actorUid) return;
  await db.collection("users").doc(recipientUid).collection("notifications").add({
    type, text, link: link || null, actorUid, read: false, createdAt: FieldValue.serverTimestamp(),
  });
}

// Like/unlike, follow/unfollow and join/leave loops used to send a push + inbox item
// on every cycle. Now at most one per actor+target+type per day.
async function firstToday(recipientUid, actorUid, type, targetId) {
  if (!recipientUid || !actorUid || recipientUid === actorUid) return false;
  const ref = db.doc(`notifDedupe/${recipientUid}_${actorUid}_${type}_${targetId}`);
  try {
    await ref.create({ expireAt: new Date(Date.now() + 864e5) });
    return true;
  } catch (err) {
    if (err.code !== 6) return true; // not a duplicate — don't drop real notifications
    const prev = (await ref.get()).data();
    if (prev && prev.expireAt && prev.expireAt.toMillis() > Date.now()) return false;
    await ref.set({ expireAt: new Date(Date.now() + 864e5) });
    return true;
  }
}
async function notifyAndRecord(recipientUid, actorUid, { type, targetId, prefKey, title, body, data, text, link }) {
  try {
    if (!(await firstToday(recipientUid, actorUid, type, targetId))) return;
    await record(recipientUid, actorUid, type, text, link);
    await notify(recipientUid, actorUid, prefKey, title, body, data);
  } catch (err) { logger.warn("notify failed", { type, err: err.message }); }
}

/* ---- Content creation: rate-limit only (no paired counter to fix) ---- */
exports.onPostCreate = onDocumentCreated("posts/{postId}", async (e) => {
  const d = e.data && e.data.data();
  if (!d) return;
  if (!(await allow(d.authorId, "post"))) { await e.data.ref.delete().catch(() => {}); await flag(d.authorId, "post", e.data.ref); }
});
exports.onActivityCreate = onDocumentCreated("activities/{id}", async (e) => {
  const d = e.data && e.data.data();
  if (!d) return;
  if (!(await allow(d.authorId, "activity"))) { await e.data.ref.delete().catch(() => {}); await flag(d.authorId, "activity", e.data.ref); }
});
exports.onListingCreate = onDocumentCreated("listings/{id}", async (e) => {
  const d = e.data && e.data.data();
  if (!d) return;
  if (!(await allow(d.sellerId, "listing"))) { await e.data.ref.delete().catch(() => {}); await flag(d.sellerId, "listing", e.data.ref); }
});
exports.onTribeCreate = onDocumentCreated("tribes/{id}", async (e) => {
  const d = e.data && e.data.data();
  if (!d) return;
  if (!(await allow(d.ownerId, "tribe"))) { await e.data.ref.delete().catch(() => {}); await flag(d.ownerId, "tribe", e.data.ref); }
});
exports.onReportCreate = onDocumentCreated("reports/{id}", async (e) => {
  const d = e.data && e.data.data();
  if (!d) return;
  if (!(await allow(d.reporterId, "report"))) { await e.data.ref.delete().catch(() => {}); await flag(d.reporterId, "report", e.data.ref); }
});

/* ---- Chat: new DM thread → fill in real names/photos from profiles ----
 * Clients create threads with empty participantNames/Photos (enforced by rules), so a
 * sender can't impersonate anyone. Also rate-limits how many new conversations a user
 * can start per day. */
exports.onThreadCreate = onDocumentCreatedWithAuthContext("threads/{tid}", async (e) => {
  const t = e.data && e.data.data();
  if (!t) return;
  const [a, b] = t.participants || [];
  const starter = e.authType === "app_user" ? e.authId : null; // the user who opened the conversation
  if (starter && !(await allow(starter, "thread"))) {
    await e.data.ref.delete().catch(() => {}); await flag(starter, "thread", e.data.ref); return;
  }
  const users = await Promise.all([a, b].map((u) => db.doc(`users/${u}`).get()));
  const names = {}, photos = {};
  users.forEach((s, i) => {
    const d = s.exists ? s.data() : {};
    names[[a, b][i]] = d.displayName || "Explorer";
    photos[[a, b][i]] = d.photoURL || "";
  });
  await e.data.ref.update({ participantNames: names, participantPhotos: photos }).catch((err) =>
    logger.warn("thread name fill failed", { tid: e.params.tid, err: err.message }));
});

/* ---- Chat: DM messages (rate-limit + notify recipient) ---- */
exports.onDmMessageCreate = onDocumentCreated("threads/{tid}/messages/{mid}", async (e) => {
  const m = e.data && e.data.data();
  if (!m) return;
  if (!(await allow(m.senderId, "message"))) {
    await e.data.ref.delete().catch(() => {});
    await flag(m.senderId, "message", e.data.ref);
    return;
  }
  try {
    const t = (await db.doc(`threads/${e.params.tid}`).get()).data();
    if (!t) return;
    const other = (t.participants || []).find((u) => u !== m.senderId);
    if (!other) return;
    // Name comes from the sender's profile, never from client-written thread data.
    const sender = (await db.doc(`users/${m.senderId}`).get()).data() || {};
    const name = sender.displayName || "Someone";
    await record(other, m.senderId, "message", `${name} sent you a message`, `/chat/${e.params.tid}`);
    await notify(other, m.senderId, "message", name, (m.text || "").slice(0, 140), { link: `/chat/${e.params.tid}` });
  } catch (err) { logger.warn("dm notify failed", { err: err.message }); }
});

/* ---- Chat: tribe group messages (rate-limit) ---- */
exports.onTribeMessageCreate = onDocumentCreated("tribes/{id}/messages/{mid}", async (e) => {
  const m = e.data && e.data.data();
  if (!m) return;
  if (!(await allow(m.authorId, "message"))) {
    await e.data.ref.delete().catch(() => {});
    await flag(m.authorId, "message", e.data.ref);
  }
});

/* ---- Posts: likes ---- */
exports.onPostLikeCreate = onDocumentCreated("posts/{postId}/likes/{uid}", (e) => once(e, async () => {
  const { postId, uid } = e.params;
  await bump(`posts/${postId}`, "likeCount", 1);
  const post = (await db.doc(`posts/${postId}`).get()).data();
  if (post) await notifyAndRecord(post.authorId, uid, { type: "like", targetId: postId, prefKey: "kudos", title: "New kudos", body: `Someone liked "${post.title || "your post"}"`, data: { type: "post", id: postId }, text: "Someone liked your post", link: `/comments/posts/${postId}` });
}));
exports.onPostLikeDelete = onDocumentDeleted("posts/{postId}/likes/{uid}", (e) => once(e, () =>
  bump(`posts/${e.params.postId}`, "likeCount", -1)));

/* ---- Posts: comments ---- */
exports.onPostCommentCreate = onDocumentCreated("posts/{postId}/comments/{cid}", (e) => once(e, async () => {
  const { postId } = e.params;
  const c = e.data && e.data.data();
  // Keep counter logic identical, then reverse via delete if over limit.
  const ok = c ? await allow(c.authorId, "comment") : true;
  await bump(`posts/${postId}`, "commentCount", 1);
  if (!ok) { await e.data.ref.delete().catch(() => {}); await flag(c.authorId, "comment", e.data.ref); return; } // onPostCommentDelete reverses the +1
  const post = (await db.doc(`posts/${postId}`).get()).data();
  if (post && c) {
    try {
      await notify(post.authorId, c.authorId, "comments", "New comment", `${c.authorName || "Someone"} commented on your post`, { type: "post", id: postId });
      await record(post.authorId, c.authorId, "comment", `${c.authorName || "Someone"} commented on your post`, `/comments/posts/${postId}`);
    } catch (err) { logger.warn("comment notify failed", { err: err.message }); }
  }
}));
exports.onPostCommentDelete = onDocumentDeleted("posts/{postId}/comments/{cid}", (e) => once(e, () =>
  bump(`posts/${e.params.postId}`, "commentCount", -1)));

/* ---- Activities: likes / comments / attendees ---- */
exports.onActLikeCreate = onDocumentCreated("activities/{id}/likes/{uid}", (e) => once(e, () =>
  bump(`activities/${e.params.id}`, "likeCount", 1)));
exports.onActLikeDelete = onDocumentDeleted("activities/{id}/likes/{uid}", (e) => once(e, () =>
  bump(`activities/${e.params.id}`, "likeCount", -1)));

exports.onActCommentCreate = onDocumentCreated("activities/{id}/comments/{cid}", (e) => once(e, async () => {
  const { id } = e.params;
  const c = e.data && e.data.data();
  const ok = c ? await allow(c.authorId, "comment") : true;
  await bump(`activities/${id}`, "commentCount", 1);
  if (!ok) { await e.data.ref.delete().catch(() => {}); await flag(c.authorId, "comment", e.data.ref); return; } // onActCommentDelete reverses the +1
  const act = (await db.doc(`activities/${id}`).get()).data();
  if (act && c) {
    try {
      await notify(act.authorId, c.authorId, "comments", "New comment", `${c.authorName || "Someone"} commented on your activity`, { type: "activity", id });
      await record(act.authorId, c.authorId, "comment", `${c.authorName || "Someone"} commented on your activity`, `/comments/activities/${id}`);
    } catch (err) { logger.warn("comment notify failed", { err: err.message }); }
  }
}));
exports.onActCommentDelete = onDocumentDeleted("activities/{id}/comments/{cid}", (e) => once(e, () =>
  bump(`activities/${e.params.id}`, "commentCount", -1)));

const RECENT_CAP = 8;
exports.onActJoinCreate = onDocumentCreated("activities/{id}/attendees/{uid}", (e) => once(e, async () => {
  const { id, uid } = e.params;
  const a = e.data && e.data.data();
  const meDoc = { uid, displayName: (a && a.displayName) || null, photoURL: (a && a.photoURL) || null };
  const ref = db.doc(`activities/${id}`);
  // The count is a plain atomic increment (always applied, once per event). It used to
  // ride inside the recentAttendees transaction, which can give up under contention
  // when many people join at once — losing the count change (seen as 10 vs 9 actual).
  await bump(`activities/${id}`, "attendeeCount", 1);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const cur = snap.data().recentAttendees || [];
    const next = [meDoc, ...cur.filter((x) => x.uid !== uid)].slice(0, RECENT_CAP); // bounded, uid-keyed
    tx.update(ref, { recentAttendees: next });
  }).catch((err) => logger.warn("recent attendees update failed", { id, err: err.message }));
  const act = (await ref.get()).data();
  if (act) await notifyAndRecord(act.authorId, uid, { type: "join", targetId: id, prefKey: "activityJoin", title: "Someone's joining", body: `${(a && a.displayName) || "Someone"} joined your activity`, data: { type: "activity", id }, text: `${(a && a.displayName) || "Someone"} joined your activity`, link: `/comments/activities/${id}` });
}));
exports.onActJoinDelete = onDocumentDeleted("activities/{id}/attendees/{uid}", (e) => once(e, async () => {
  const { id, uid } = e.params;
  const ref = db.doc(`activities/${id}`);
  await bump(`activities/${id}`, "attendeeCount", -1);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const cur = snap.data().recentAttendees || [];
    tx.update(ref, { recentAttendees: cur.filter((x) => x.uid !== uid) });
  }).catch((err) => logger.warn("recent attendees update failed", { id, err: err.message }));
}));

/* ---- Tribes: members ---- */
exports.onTribeJoinCreate = onDocumentCreated("tribes/{id}/members/{uid}", (e) => once(e, async () => {
  const { id, uid } = e.params;
  await bump(`tribes/${id}`, "memberCount", 1);
  const tribe = (await db.doc(`tribes/${id}`).get()).data();
  if (tribe) await notifyAndRecord(tribe.ownerId, uid, { type: "tribe", targetId: id, prefKey: "tribeMember", title: "New tribe member", body: `Someone joined "${tribe.name || "your tribe"}"`, data: { type: "tribe", id }, text: `Someone joined "${tribe.name || "your tribe"}"`, link: `/tribe/${id}` });
}));
exports.onTribeJoinDelete = onDocumentDeleted("tribes/{id}/members/{uid}", (e) => once(e, () =>
  bump(`tribes/${e.params.id}`, "memberCount", -1)));

/* ---- Follows ---- */
exports.onFollowCreate = onDocumentCreated("users/{uid}/following/{targetUid}", (e) => once(e, async () => {
  const { uid, targetUid } = e.params;
  const ok = await allow(uid, "follow");
  await bump(`users/${uid}`, "followingCount", 1);
  await bump(`users/${targetUid}`, "followerCount", 1);
  if (!ok) { await e.data.ref.delete().catch(() => {}); await flag(uid, "follow", e.data.ref); return; } // onFollowDelete reverses both bumps
  await notifyAndRecord(targetUid, uid, { type: "follow", targetId: targetUid, prefKey: "newFollower", title: "New follower", body: "Someone started following you", data: { type: "user", id: uid }, text: "Someone started following you", link: `/u/${uid}` });
}));
exports.onFollowDelete = onDocumentDeleted("users/{uid}/following/{targetUid}", (e) => once(e, async () => {
  const { uid, targetUid } = e.params;
  await bump(`users/${uid}`, "followingCount", -1);
  await bump(`users/${targetUid}`, "followerCount", -1);
}));

/* ====================== TRUST & SAFETY ====================== */

/* Vouches -> vouchCount */
exports.onReferenceCreate = onDocumentCreated("users/{uid}/references/{fromUid}", (e) => once(e, async () => {
  await bump(`users/${e.params.uid}`, "vouchCount", 1);
  await notifyAndRecord(e.params.uid, e.params.fromUid, { type: "vouch", targetId: e.params.uid, prefKey: "vouch", title: "New vouch", body: "Someone vouched for you", data: { type: "user", id: e.params.uid }, text: "Someone vouched for you", link: `/u/${e.params.uid}` });
}));
exports.onReferenceDelete = onDocumentDeleted("users/{uid}/references/{fromUid}", (e) => once(e, () =>
  bump(`users/${e.params.uid}`, "vouchCount", -1)));

/* Reviews -> ratingAvg / ratingCount (incremental, transactional).
 * overall is clamped to [1,5] as defense-in-depth — rules already bound it, but the
 * server must never let a crafted value skew a partner's trust score. */
const clampRating = (v) => Math.min(5, Math.max(1, Number(v) || 1));
exports.onReviewCreate = onDocumentCreated("users/{uid}/reviews/{reviewerUid}", (e) => once(e, async () => {
  const r = e.data.data() || {}; const overall = clampRating(r.overall);
  const ref = db.doc(`users/${e.params.uid}`);
  await db.runTransaction(async (tx) => {
    const d = (await tx.get(ref)).data() || {};
    const count = (d.ratingCount || 0) + 1;
    const avg = ((d.ratingAvg || 0) * (d.ratingCount || 0) + overall) / count;
    tx.set(ref, { ratingCount: count, ratingAvg: Math.round(avg * 100) / 100 }, { merge: true });
  }).catch((err) => logger.warn("rating update failed", { err: err.message }));
  await record(e.params.uid, e.params.reviewerUid, "review", "You got a new partner review", `/u/${e.params.uid}`).catch(() => {});
}));
exports.onReviewDelete = onDocumentDeleted("users/{uid}/reviews/{reviewerUid}", (e) => once(e, async () => {
  const r = e.data.data() || {}; const overall = clampRating(r.overall);
  const ref = db.doc(`users/${e.params.uid}`);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const d = snap.data();
    const count = Math.max(0, (d.ratingCount || 0) - 1);
    const avg = count === 0 ? 0 : ((d.ratingAvg || 0) * (d.ratingCount || 0) - overall) / count;
    tx.set(ref, { ratingCount: count, ratingAvg: Math.round(avg * 100) / 100 }, { merge: true });
  }).catch((err) => logger.warn("rating update failed", { err: err.message }));
}));

/* Completed adventure -> bump adventuresCompleted for owner + partners, ONCE per trip.
 * The adventureCredited flag (server-only per rules) stops status cycling
 * (safe → active → safe) from inflating trust scores; only real user ids count. */
exports.onTripPlanUpdate = onDocumentUpdated("tripPlans/{id}", async (e) => {
  const before = e.data.before.data() || {}; const after = e.data.after.data() || {};
  if (after.status !== "safe" || before.status === "safe" || after.adventureCredited) return;
  const ref = e.data.after.ref;
  const credited = await db.runTransaction(async (tx) => {
    const cur = (await tx.get(ref)).data() || {};
    if (cur.adventureCredited) return false;
    tx.update(ref, { adventureCredited: true });
    return true;
  }).catch(() => false);
  if (!credited) return;
  const candidates = [...new Set([after.ownerId, ...(after.partners || []).slice(0, 10)])].filter((u) => typeof u === "string" && u && !u.includes("/"));
  const real = await Promise.all(candidates.map(async (u) => ((await db.doc(`users/${u}`).get()).exists ? u : null)));
  await Promise.all(real.filter(Boolean).map((u) => bump(`users/${u}`, "adventuresCompleted", 1)));
});

/* Scheduled overdue check. Every 15 min: any active trip past expected-return + grace
 * with no check-in is flipped to "overdue" and the owner is alerted. Each trip is
 * handled independently so one failure can't stop the rest.
 * NOTE: alerting the external emergency contact (SMS/email) still needs a provider
 * (Twilio/SendGrid). Until then the copy does NOT promise the contact is alerted. */
exports.checkOverdueTrips = onSchedule("every 15 minutes", async () => {
  const now = Date.now();
  const snap = await db.collection("tripPlans").where("status", "==", "active").limit(2000).get();
  for (const doc of snap.docs) {
    try {
      const t = doc.data();
      if (t.checkedInAt || t.escalatedAt) continue;
      const due = t.expectedReturnAt && t.expectedReturnAt.toMillis ? t.expectedReturnAt.toMillis() : 0;
      const grace = (t.graceMins || 60) * 60000;
      if (due && now > due + grace) {
        await doc.ref.update({ status: "overdue", escalatedAt: FieldValue.serverTimestamp() });
        await record(t.ownerId, null, "overdue", `You're overdue from "${t.objective || "your trip"}". Tap to check in so your partners know you're safe.`, "/safety/trips");
        await notify(t.ownerId, null, "overdue", "Trip overdue", "You're past your expected return. Check in now.", { type: "trip", id: doc.id });
        // TODO(provider): SMS/email t.emergencyContact with the plan + last-known location.
      }
    } catch (err) { logger.error("overdue check failed", { trip: doc.id, err: err.message }); }
  }
});

/* ====================== ACCOUNT DELETION ======================
 * GDPR Art. 17 / CCPA. Runs with the Admin SDK so it can remove everything the user
 * created or that identifies them — including other users' likes/comments under the
 * user's posts, which rules (correctly) don't let a client delete. Requires a sign-in
 * within the last 15 minutes so a stolen, long-lived session can't wipe an account. */
const RECENT_LOGIN_SEC = 15 * 60;
exports.deleteAccount = onCall({ timeoutSeconds: 540, memory: "512MiB" }, async (req) => {
  const uid = req.auth && req.auth.uid;
  if (!uid) throw new HttpsError("unauthenticated", "Sign in first.");
  const authTime = Number(req.auth.token.auth_time || 0);
  if (Date.now() / 1000 - authTime > RECENT_LOGIN_SEC) {
    throw new HttpsError("failed-precondition", "Recent sign-in required.");
  }
  const del = async (q) => {
    const snap = await q.get();
    await Promise.all(snap.docs.map((d) => db.recursiveDelete(d.ref)));
    return snap.size;
  };
  const counts = {};
  // Content the user owns (with all sub-collections: likes, comments, attendees, members, messages).
  counts.posts = await del(db.collection("posts").where("authorId", "==", uid));
  counts.activities = await del(db.collection("activities").where("authorId", "==", uid));
  counts.tribes = await del(db.collection("tribes").where("ownerId", "==", uid));
  counts.listings = await del(db.collection("listings").where("sellerId", "==", uid));
  counts.tripPlans = await del(db.collection("tripPlans").where("ownerId", "==", uid));
  counts.threads = await del(db.collection("threads").where("participants", "array-contains", uid));
  // The user's footprint on other people's content (triggers fix the counters).
  counts.likes = await del(db.collectionGroup("likes").where("uid", "==", uid));
  counts.attendees = await del(db.collectionGroup("attendees").where("uid", "==", uid));
  counts.memberships = await del(db.collectionGroup("members").where("uid", "==", uid));
  counts.comments = await del(db.collectionGroup("comments").where("authorId", "==", uid));
  counts.tribeMessages = await del(db.collectionGroup("messages").where("authorId", "==", uid));
  counts.vouchesGiven = await del(db.collectionGroup("references").where("fromUid", "==", uid));
  counts.reviewsGiven = await del(db.collectionGroup("reviews").where("reviewerId", "==", uid));
  counts.followers = await del(db.collectionGroup("following").where("targetUid", "==", uid));
  // Private records, then the profile (with following/blocked/saves/notifications/private/...).
  await db.doc(`verifications/${uid}`).delete().catch(() => {});
  await db.recursiveDelete(db.doc(`users/${uid}`));
  // Storage: every prefix that's scoped to this uid.
  const bucket = getStorage().bucket();
  await Promise.all(["avatars", "posts", "activities", "listings", "tribes", "verifications"].map((p) =>
    bucket.deleteFiles({ prefix: `${p}/${uid}/`, force: true }).catch((err) => logger.warn("storage delete", { p, err: err.message }))));
  await getAuth().deleteUser(uid);
  logger.info("account deleted", { uid, counts });
  return { ok: true };
});
