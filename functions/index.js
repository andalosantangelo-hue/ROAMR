// ROAMR Cloud Functions (BACKEND-PLAN §9.B + counter integrity).
// Server-authoritative counters (tamper-proof) + push notifications.
// Deploy: `firebase deploy --only functions` (Blaze plan).
const { onDocumentCreated, onDocumentDeleted } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();
const db = getFirestore();

const bump = (path, field, n) =>
  db.doc(path).update({ [field]: FieldValue.increment(n) }).catch(() => {});

async function notify(recipientUid, actorUid, prefKey, title, body, data = {}) {
  if (!recipientUid || recipientUid === actorUid) return;
  const snap = await db.doc(`users/${recipientUid}/private/data`).get();
  if (!snap.exists) return;
  const u = snap.data();
  if ((u.notificationPrefs || {})[prefKey] === false) return;
  const tokens = u.fcmTokens || [];
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

/* ---- Posts: likes ---- */
exports.onPostLikeCreate = onDocumentCreated("posts/{postId}/likes/{uid}", async (e) => {
  const { postId, uid } = e.params;
  await bump(`posts/${postId}`, "likeCount", 1);
  const post = (await db.doc(`posts/${postId}`).get()).data();
  if (post) { await notify(post.authorId, uid, "kudos", "New kudos", `Someone liked "${post.title || "your post"}"`, { type: "post", id: postId }); await record(post.authorId, uid, "like", "Someone liked your post", `/comments/posts/${postId}`); }
});
exports.onPostLikeDelete = onDocumentDeleted("posts/{postId}/likes/{uid}", async (e) =>
  bump(`posts/${e.params.postId}`, "likeCount", -1));

/* ---- Posts: comments ---- */
exports.onPostCommentCreate = onDocumentCreated("posts/{postId}/comments/{cid}", async (e) => {
  const { postId } = e.params;
  await bump(`posts/${postId}`, "commentCount", 1);
  const c = e.data && e.data.data();
  const post = (await db.doc(`posts/${postId}`).get()).data();
  if (post && c) { await notify(post.authorId, c.authorId, "comments", "New comment", `${c.authorName || "Someone"} commented on your post`, { type: "post", id: postId }); await record(post.authorId, c.authorId, "comment", `${c.authorName || "Someone"} commented on your post`, `/comments/posts/${postId}`); }
});
exports.onPostCommentDelete = onDocumentDeleted("posts/{postId}/comments/{cid}", async (e) =>
  bump(`posts/${e.params.postId}`, "commentCount", -1));

/* ---- Activities: likes / comments / attendees ---- */
exports.onActLikeCreate = onDocumentCreated("activities/{id}/likes/{uid}", async (e) =>
  bump(`activities/${e.params.id}`, "likeCount", 1));
exports.onActLikeDelete = onDocumentDeleted("activities/{id}/likes/{uid}", async (e) =>
  bump(`activities/${e.params.id}`, "likeCount", -1));

exports.onActCommentCreate = onDocumentCreated("activities/{id}/comments/{cid}", async (e) => {
  const { id } = e.params;
  await bump(`activities/${id}`, "commentCount", 1);
  const c = e.data && e.data.data();
  const act = (await db.doc(`activities/${id}`).get()).data();
  if (act && c) { await notify(act.authorId, c.authorId, "comments", "New comment", `${c.authorName || "Someone"} commented on your activity`, { type: "activity", id }); await record(act.authorId, c.authorId, "comment", `${c.authorName || "Someone"} commented on your activity`, `/comments/activities/${id}`); }
});
exports.onActCommentDelete = onDocumentDeleted("activities/{id}/comments/{cid}", async (e) =>
  bump(`activities/${e.params.id}`, "commentCount", -1));

const RECENT_CAP = 8;
exports.onActJoinCreate = onDocumentCreated("activities/{id}/attendees/{uid}", async (e) => {
  const { id, uid } = e.params;
  const a = e.data && e.data.data();
  const meDoc = { uid, displayName: (a && a.displayName) || null, photoURL: (a && a.photoURL) || null };
  const ref = db.doc(`activities/${id}`);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const cur = snap.data().recentAttendees || [];
    const next = [meDoc, ...cur.filter((x) => x.uid !== uid)].slice(0, RECENT_CAP); // bounded, uid-keyed
    tx.update(ref, { attendeeCount: FieldValue.increment(1), recentAttendees: next });
  }).catch(() => {});
  const act = (await ref.get()).data();
  if (act) { await notify(act.authorId, uid, "activityJoin", "Someone's joining", `${(a && a.displayName) || "Someone"} joined your activity`, { type: "activity", id }); await record(act.authorId, uid, "join", `${(a && a.displayName) || "Someone"} joined your activity`, `/comments/activities/${id}`); }
});
exports.onActJoinDelete = onDocumentDeleted("activities/{id}/attendees/{uid}", async (e) => {
  const { id, uid } = e.params;
  const ref = db.doc(`activities/${id}`);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const cur = snap.data().recentAttendees || [];
    tx.update(ref, { attendeeCount: FieldValue.increment(-1), recentAttendees: cur.filter((x) => x.uid !== uid) });
  }).catch(() => {});
});

/* ---- Tribes: members ---- */
exports.onTribeJoinCreate = onDocumentCreated("tribes/{id}/members/{uid}", async (e) => {
  const { id, uid } = e.params;
  await bump(`tribes/${id}`, "memberCount", 1);
  const tribe = (await db.doc(`tribes/${id}`).get()).data();
  if (tribe) { await notify(tribe.ownerId, uid, "tribeMember", "New tribe member", `Someone joined "${tribe.name || "your tribe"}"`, { type: "tribe", id }); await record(tribe.ownerId, uid, "tribe", `Someone joined "${tribe.name || "your tribe"}"`, `/app/tribes`); }
});
exports.onTribeJoinDelete = onDocumentDeleted("tribes/{id}/members/{uid}", async (e) =>
  bump(`tribes/${e.params.id}`, "memberCount", -1));

/* ---- Follows ---- */
exports.onFollowCreate = onDocumentCreated("users/{uid}/following/{targetUid}", async (e) => {
  const { uid, targetUid } = e.params;
  await bump(`users/${uid}`, "followingCount", 1);
  await bump(`users/${targetUid}`, "followerCount", 1);
  await notify(targetUid, uid, "newFollower", "New follower", "Someone started following you", { type: "user", id: uid });
  await record(targetUid, uid, "follow", "Someone started following you", `/u/${uid}`);
});
exports.onFollowDelete = onDocumentDeleted("users/{uid}/following/{targetUid}", async (e) => {
  const { uid, targetUid } = e.params;
  await bump(`users/${uid}`, "followingCount", -1);
  await bump(`users/${targetUid}`, "followerCount", -1);
});
