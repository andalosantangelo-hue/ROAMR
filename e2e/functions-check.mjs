// Targeted checks for Cloud Functions the synthetic-user run doesn't reach (emulators only):
//   checkOverdueTrips (scheduled), onGuideApplicationWrite, deleteAccount, shopCatalog.
// Run: npx firebase emulators:exec --project demo-roamr --only auth,firestore,storage,functions "node e2e/functions-check.mjs"
import { createRequire } from "node:module";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";

const PROJECT = "demo-roamr";
process.env.GCLOUD_PROJECT ||= PROJECT;
process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= "127.0.0.1:9099";
process.env.FIREBASE_STORAGE_EMULATOR_HOST ||= "127.0.0.1:9199";
const FN = `http://127.0.0.1:5001/${PROJECT}/us-central1`;
const BUCKET = `${PROJECT}.appspot.com`;

initializeApp({ projectId: PROJECT, storageBucket: BUCKET });
const db = getFirestore();
const results = [];
const check = (name, ok, detail = "") => { results.push({ name, ok }); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(fn, ms = 20000) {
  for (const end = Date.now() + ms; Date.now() < end; await sleep(250)) if (await fn()) return true;
  return false;
}
const run = Date.now().toString(36);

// ---- checkOverdueTrips: call the deployed handler in-process against the emulator ----
{
  const fns = createRequire(import.meta.url)("../functions/index.js");
  const owner = `overdue-${run}`;
  await db.doc(`users/${owner}`).set({ displayName: "Overdue Tester" });
  const ago = (h) => Timestamp.fromMillis(Date.now() - h * 3600e3);
  const trips = {
    late: { ownerId: owner, status: "active", objective: "Late trip", expectedReturnAt: ago(3), graceMins: 60 },
    inGrace: { ownerId: owner, status: "active", objective: "In grace", expectedReturnAt: ago(0.5), graceMins: 60 },
    checkedIn: { ownerId: owner, status: "active", objective: "Checked in", expectedReturnAt: ago(3), checkedInAt: ago(1) },
  };
  for (const [k, t] of Object.entries(trips)) await db.doc(`tripPlans/${owner}-${k}`).set(t);
  check("checkOverdueTrips has a runnable handler", typeof fns.checkOverdueTrips?.run === "function");
  await fns.checkOverdueTrips.run({});
  const st = async (k) => (await db.doc(`tripPlans/${owner}-${k}`).get()).data();
  const late = await st("late");
  check("overdue trip flipped to overdue + escalatedAt", late.status === "overdue" && !!late.escalatedAt, late.status);
  check("trip still in grace period left active", (await st("inGrace")).status === "active");
  check("checked-in trip left active", (await st("checkedIn")).status === "active");
  const n = await db.collection(`users/${owner}/notifications`).where("type", "==", "overdue").get();
  check("owner got an in-app overdue notice", n.size === 1, `count ${n.size}`);
  await fns.checkOverdueTrips.run({});
  const n2 = await db.collection(`users/${owner}/notifications`).where("type", "==", "overdue").get();
  check("second run does not re-alert", n2.size === 1, `count ${n2.size}`);
}

// ---- onGuideApplicationWrite: real trigger through the functions emulator ----
{
  const g = `guide-${run}`;
  await db.doc(`users/${g}`).set({ displayName: "Guide Tester" });
  const app = db.doc(`guideApplications/${g}`);
  await app.set({ status: "pending", specialties: ["fly fishing"], region: "Montana" });
  await app.update({ status: "approved" });
  const approved = await until(async () => (await db.doc(`users/${g}`).get()).data()?.guide?.verified === true);
  const guide = (await db.doc(`users/${g}`).get()).data()?.guide;
  check("approval sets public guide badge", approved && guide?.specialties?.[0] === "fly fishing" && guide?.region === "Montana");
  const noticed = await until(async () => !(await db.collection(`users/${g}/notifications`).where("type", "==", "guide").get()).empty);
  check("approval notifies the guide", noticed);
  await app.update({ status: "rejected" });
  const removed = await until(async () => (await db.doc(`users/${g}`).get()).data()?.guide === undefined);
  check("un-approving removes the badge", removed);
}

// ---- deleteAccount: real callable through the functions emulator ----
{
  const email = `delete-${run}@roamr.test`;
  const signUp = await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "Passw0rd!x", returnSecureToken: true }),
  }).then((r) => r.json());
  const uid = signUp.localId;
  await db.doc(`users/${uid}`).set({ displayName: "Delete Me" });
  await db.doc(`users/${uid}/private/data`).set({ emergencyContact: "555-0100", fcmTokens: [] });
  await db.doc(`posts/del-${run}`).set({ authorId: uid, text: "bye" });
  await db.doc(`guideApplications/${uid}`).set({ status: "pending" });
  const file = getStorage().bucket(BUCKET).file(`avatars/${uid}/a.jpg`);
  await file.save(Buffer.from("x"), { contentType: "image/jpeg" });

  const call = (token) => fetch(`${FN}/deleteAccount`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ data: {} }),
  }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));

  const anon = await call(null);
  check("deleteAccount rejects unauthenticated calls", anon.body?.error?.status === "UNAUTHENTICATED", `${anon.status}`);
  const res = await call(signUp.idToken);
  check("deleteAccount returns ok", res.body?.result?.ok === true, JSON.stringify(res.body).slice(0, 120));
  check("profile deleted", !(await db.doc(`users/${uid}`).get()).exists);
  check("private medical/PII subcollection deleted", !(await db.doc(`users/${uid}/private/data`).get()).exists);
  check("user's posts deleted", !(await db.doc(`posts/del-${run}`).get()).exists);
  check("guide application deleted", !(await db.doc(`guideApplications/${uid}`).get()).exists);
  check("storage files deleted", !(await file.exists())[0]);
  const authGone = await getAuth().getUser(uid).then(() => false).catch((e) => e.code === "auth/user-not-found");
  check("auth user deleted", authGone);
}

// ---- shopCatalog: boots and answers (live catalog, or the documented 502 when Shopify is unreachable) ----
{
  const r = await fetch(`${FN}/shopCatalog`);
  const body = await r.json().catch(() => null);
  const ok = (r.status === 200 && Array.isArray(body?.products)) || (r.status === 502 && body?.error === "catalog_unavailable");
  check("shopCatalog responds with catalog or catalog_unavailable", ok, `${r.status}${r.status === 200 ? `, ${body.products.length} products` : ""}`);
}

const failed = results.filter((r) => !r.ok).length;
console.log(`\nfunctions-check: ${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
