// ROAMR Cloud Functions (BACKEND-PLAN §9.B + counter integrity + abuse rate limiting).
// Server-authoritative counters (tamper-proof) + push notifications + per-user rate limits.
// Deploy: `firebase deploy --only functions` (Blaze plan).
const { onDocumentCreated, onDocumentDeleted, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();
const db = getFirestore();

const bump = (path, field, n) =>
  db.doc(path).update({ [field]: FieldValue.increment(n) }).catch(() => {});

/* ------------------------------------------------------------------ *
 * Abuse rate limiting (server-authoritative, FAIL-OPEN).
 * A logged-in client can call the SDK directly, so per-user spam limits
 * must live server-side. Each rate-limited create increments a fixed-window
 * counter in rateLimits/{uid}; over-limit docs are deleted. Any error leaves
 * the write intact so legitimate users are NEVER blocked by this layer.
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
};

// Returns true if the action is within the user's limit (fail-open on error).
async function allow(uid, action) {
  if (!uid) return true;
  const cfg = RL[action];
  if (!cfg) return true;
  const ref = db.doc(`rateLimits/${uid}`);
  try {
    return await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const now = Date.now();
      const winStart = now - cfg.windowSec * 1000;
      const data = snap.exists ? snap.data() : {};
      const entry = data[action] || { count: 0, start: now };
      let count = entry.count;
      let start = entry.start;
      if (!start || start < winStart) { count = 0; start = now; } // window rolled over
      count += 1;
      tx.set(ref, { [action]: { count, start, updatedAt: now } }, { merge: true });
      return count <= cfg.max;
    });
  } catch {
    return true; // fail open — never block legitimate writes on infra hiccups
  }
}

// Record an abuse trip for monitoring (server-only collection; best-effort).
async function flag(uid, action, ref) {
  try {
    await db.collection("abuseFlags").add({
      uid: uid || null, action, path: ref ? ref.path : null,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch { /* best effort */ }
}

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

// Public profile snapshot of whoever triggered a notification, so the inbox can
// show their real name + photo and link to their profile (never "Someone").
async function actorInfo(uid) {
  if (!uid) return { name: null, photo: null };
  try {
    const u = (await db.doc(`users/${uid}`).get()).data() || {};
    return { name: u.displayName || null, photo: u.photoURL || null };
  } catch { return { name: null, photo: null }; }
}

// In-app notification inbox doc (written regardless of push prefs/tokens).
// `action` is the verb phrase ("liked your post"); the client renders
// "<actorName> <action>". `text` is kept as a full sentence for older clients.
async function record(recipientUid, actorUid, type, action, link) {
  if (!recipientUid || recipientUid === actorUid) return;
  const a = await actorInfo(actorUid);
  await db.collection("users").doc(recipientUid).collection("notifications").add({
    type, action, text: `${a.name || "Someone"} ${action}`, link: link || null,
    actorUid: actorUid || null, actorName: a.name, actorPhoto: a.photo,
    read: false, createdAt: FieldValue.serverTimestamp(),
  });
}
const nameOf = async (uid) => (await actorInfo(uid)).name || "Someone";

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
    const name = (t.participantNames && t.participantNames[m.senderId]) || "Someone";
    await record(other, m.senderId, "message", "sent you a message", `/chat/${e.params.tid}`);
    await notify(other, m.senderId, "message", name, (m.text || "").slice(0, 140), { link: `/chat/${e.params.tid}` });
  } catch { /* best effort */ }
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
exports.onPostLikeCreate = onDocumentCreated("posts/{postId}/likes/{uid}", async (e) => {
  const { postId, uid } = e.params;
  await bump(`posts/${postId}`, "likeCount", 1);
  const post = (await db.doc(`posts/${postId}`).get()).data();
  if (post) { const who = await nameOf(uid); await notify(post.authorId, uid, "kudos", "New kudos", `${who} liked "${post.title || "your post"}"`, { type: "post", id: postId }); await record(post.authorId, uid, "like", "liked your post", `/comments/posts/${postId}`); }
});
exports.onPostLikeDelete = onDocumentDeleted("posts/{postId}/likes/{uid}", async (e) =>
  bump(`posts/${e.params.postId}`, "likeCount", -1));

/* ---- Posts: comments ---- */
exports.onPostCommentCreate = onDocumentCreated("posts/{postId}/comments/{cid}", async (e) => {
  const { postId } = e.params;
  const c = e.data && e.data.data();
  // Keep counter logic identical, then reverse via delete if over limit.
  const ok = c ? await allow(c.authorId, "comment") : true;
  await bump(`posts/${postId}`, "commentCount", 1);
  if (!ok) { await e.data.ref.delete().catch(() => {}); await flag(c.authorId, "comment", e.data.ref); return; } // onPostCommentDelete reverses the +1
  const post = (await db.doc(`posts/${postId}`).get()).data();
  if (post && c) { await notify(post.authorId, c.authorId, "comments", "New comment", `${c.authorName || "Someone"} commented on your post`, { type: "post", id: postId }); await record(post.authorId, c.authorId, "comment", "commented on your post", `/comments/posts/${postId}`); }
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
  const c = e.data && e.data.data();
  const ok = c ? await allow(c.authorId, "comment") : true;
  await bump(`activities/${id}`, "commentCount", 1);
  if (!ok) { await e.data.ref.delete().catch(() => {}); await flag(c.authorId, "comment", e.data.ref); return; } // onActCommentDelete reverses the +1
  const act = (await db.doc(`activities/${id}`).get()).data();
  if (act && c) { await notify(act.authorId, c.authorId, "comments", "New comment", `${c.authorName || "Someone"} commented on your activity`, { type: "activity", id }); await record(act.authorId, c.authorId, "comment", "commented on your activity", `/comments/activities/${id}`); }
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
  if (act) { await notify(act.authorId, uid, "activityJoin", "Someone's joining", `${(a && a.displayName) || "Someone"} joined your activity`, { type: "activity", id }); await record(act.authorId, uid, "join", "joined your activity", `/comments/activities/${id}`); }
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
  if (tribe) { const who = await nameOf(uid); await notify(tribe.ownerId, uid, "tribeMember", "New tribe member", `${who} joined "${tribe.name || "your tribe"}"`, { type: "tribe", id }); await record(tribe.ownerId, uid, "tribe", `joined "${tribe.name || "your tribe"}"`, `/tribe/${id}`); }
});
exports.onTribeJoinDelete = onDocumentDeleted("tribes/{id}/members/{uid}", async (e) =>
  bump(`tribes/${e.params.id}`, "memberCount", -1));

/* ---- Follows ---- */
exports.onFollowCreate = onDocumentCreated("users/{uid}/following/{targetUid}", async (e) => {
  const { uid, targetUid } = e.params;
  const ok = await allow(uid, "follow");
  await bump(`users/${uid}`, "followingCount", 1);
  await bump(`users/${targetUid}`, "followerCount", 1);
  if (!ok) { await e.data.ref.delete().catch(() => {}); await flag(uid, "follow", e.data.ref); return; } // onFollowDelete reverses both bumps
  const who = await nameOf(uid);
  await notify(targetUid, uid, "newFollower", "New follower", `${who} started following you`, { type: "user", id: uid });
  await record(targetUid, uid, "follow", "started following you", `/u/${uid}`);
});
exports.onFollowDelete = onDocumentDeleted("users/{uid}/following/{targetUid}", async (e) => {
  const { uid, targetUid } = e.params;
  await bump(`users/${uid}`, "followingCount", -1);
  await bump(`users/${targetUid}`, "followerCount", -1);
});

/* ====================== TRUST & SAFETY ====================== */

/* Vouches -> vouchCount */
exports.onReferenceCreate = onDocumentCreated("users/{uid}/references/{fromUid}", async (e) => {
  await bump(`users/${e.params.uid}`, "vouchCount", 1);
  await record(e.params.uid, e.params.fromUid, "vouch", "Someone vouched for you", `/u/${e.params.uid}`);
});
exports.onReferenceDelete = onDocumentDeleted("users/{uid}/references/{fromUid}", async (e) =>
  bump(`users/${e.params.uid}`, "vouchCount", -1));

/* Reviews -> ratingAvg / ratingCount (incremental, transactional).
 * overall is clamped to [1,5] as defense-in-depth — rules already bound it, but the
 * server must never let a crafted value skew a partner's trust score. */
const clampRating = (v) => Math.min(5, Math.max(1, Number(v) || 1));
exports.onReviewCreate = onDocumentCreated("users/{uid}/reviews/{reviewerUid}", async (e) => {
  const r = e.data.data() || {}; const overall = clampRating(r.overall);
  const ref = db.doc(`users/${e.params.uid}`);
  await db.runTransaction(async (tx) => {
    const d = (await tx.get(ref)).data() || {};
    const count = (d.ratingCount || 0) + 1;
    const avg = ((d.ratingAvg || 0) * (d.ratingCount || 0) + overall) / count;
    tx.set(ref, { ratingCount: count, ratingAvg: Math.round(avg * 100) / 100 }, { merge: true });
  }).catch(() => {});
  await record(e.params.uid, e.params.reviewerUid, "review", "You got a new partner review", `/u/${e.params.uid}`);
});
exports.onReviewDelete = onDocumentDeleted("users/{uid}/reviews/{reviewerUid}", async (e) => {
  const r = e.data.data() || {}; const overall = clampRating(r.overall);
  const ref = db.doc(`users/${e.params.uid}`);
  await db.runTransaction(async (tx) => {
    const d = (await tx.get(ref)).data() || {};
    const count = Math.max(0, (d.ratingCount || 0) - 1);
    const avg = count === 0 ? 0 : ((d.ratingAvg || 0) * (d.ratingCount || 0) - overall) / count;
    tx.set(ref, { ratingCount: count, ratingAvg: Math.round(avg * 100) / 100 }, { merge: true });
  }).catch(() => {});
});

/* Completed adventure -> bump adventuresCompleted for owner + partners when a trip is marked safe */
exports.onTripPlanUpdate = onDocumentUpdated("tripPlans/{id}", async (e) => {
  const before = e.data.before.data() || {}; const after = e.data.after.data() || {};
  if (after.status === "safe" && before.status !== "safe") {
    const uids = [after.ownerId, ...(after.partners || [])].filter(Boolean);
    await Promise.all(uids.map((u) => bump(`users/${u}`, "adventuresCompleted", 1)));
  }
});

/* THE BIG ONE — scheduled overdue check. ROAMR's first server cron.
 * Every 15 min: any active trip past expected-return + grace with no check-in is flipped
 * to "overdue" and the owner is alerted. SMS/email to an EXTERNAL emergency contact needs a
 * provider (Twilio/SendGrid) — that wire-up is the only piece left; the escalation runs here. */
exports.checkOverdueTrips = onSchedule("every 15 minutes", async () => {
  const now = Date.now();
  const snap = await db.collection("tripPlans").where("status", "==", "active").get();
  for (const doc of snap.docs) {
    const t = doc.data();
    if (t.checkedInAt || t.escalatedAt) continue;
    const due = t.expectedReturnAt && t.expectedReturnAt.toMillis ? t.expectedReturnAt.toMillis() : 0;
    const grace = (t.graceMins || 60) * 60000;
    if (due && now > due + grace) {
      await doc.ref.update({ status: "overdue", escalatedAt: FieldValue.serverTimestamp() }).catch(() => {});
      await record(t.ownerId, null, "overdue", `You're overdue from "${t.objective || "your trip"}". Check in, or we'll alert your contact.`, "/safety/trips");
      await notify(t.ownerId, null, "overdue", "Trip overdue", "Check in now, or we'll alert your emergency contact.", { type: "trip", id: doc.id });
      // TODO(provider): SMS/email t.emergencyContact with the plan + last-known location.
    }
  }
});

/* ---- ROAMR Apparel: Shopify catalog proxy ----
 * The app's Marketplace → ROAMR Apparel tab reads the live Shopify catalog
 * through this endpoint (Shopify's public products.json has no CORS headers,
 * so the browser can't call it directly). Cached in memory + at the CDN for
 * 10 minutes. Checkout happens on Shopify via cart permalinks, so no
 * Shopify secrets live here. */
const { onRequest } = require("firebase-functions/v2/https");
const SHOP = "https://roamrapparel.org";
let shopCache = { at: 0, body: null };

const stripHtml = (h = "") => h.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
  .replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();

function trimProduct(p) {
  return {
    id: p.id, handle: p.handle, title: p.title, type: p.product_type || "", tags: p.tags || [],
    description: stripHtml(p.body_html).slice(0, 600),
    images: (p.images || []).slice(0, 6).map((i) => i.src),
    options: (p.options || []).map((o) => ({ name: o.name, values: o.values })),
    variants: (p.variants || []).map((v) => ({
      id: v.id, title: v.title, price: v.price, compareAt: v.compare_at_price || null, available: !!v.available,
      options: [v.option1, v.option2, v.option3].filter((x) => x != null),
      image: (v.featured_image && v.featured_image.src) || null,
    })),
  };
}

exports.shopCatalog = onRequest({ cors: true, region: "us-central1", memory: "256MiB", maxInstances: 5 }, async (req, res) => {
  try {
    if (!shopCache.body || Date.now() - shopCache.at > 10 * 60 * 1000) {
      const r = await fetch(`${SHOP}/products.json?limit=250`, { headers: { "User-Agent": "ROAMR-App/1.0" } });
      if (!r.ok) throw new Error(`Shopify ${r.status}`);
      const json = await r.json();
      shopCache = { at: Date.now(), body: { fetchedAt: new Date().toISOString(), products: (json.products || []).map(trimProduct) } };
    }
    res.set("Cache-Control", "public, max-age=300, s-maxage=600");
    res.json(shopCache.body);
  } catch (e) {
    if (shopCache.body) { res.json(shopCache.body); return; } // serve stale on upstream hiccup
    res.status(502).json({ error: "catalog_unavailable" });
  }
});
