// Firestore security-rules unit tests — proves the security boundary.
// Run locally (network unrestricted) against the emulator:
//   npm i -D @firebase/rules-unit-testing firebase-tools
//   npm run test:rules
import { describe, it, beforeAll, afterAll, beforeEach, expect } from "vitest";
import { readFileSync } from "fs";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

let env;
beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "roamr-rules-test",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});
afterAll(async () => { await env?.cleanup(); });
beforeEach(async () => { await env.clearFirestore(); });

const alice = () => env.authenticatedContext("alice").firestore();
const bob = () => env.authenticatedContext("bob").firestore();
const anon = () => env.unauthenticatedContext().firestore();
const ts = () => serverTimestamp();

// valid payloads matching the client write shapes
const post = (uid) => ({ authorId: uid, authorName: "A", authorPhotoURL: null, title: "Hike", location: "", photo: null, rating: 4, likeCount: 0, commentCount: 0, createdAt: ts() });
const tribe = (uid) => ({ name: "Trail Crew", img: null, category: "outdoor", memberCount: 0, ownerId: uid, createdAt: ts() });
const listing = (uid) => ({ sellerId: uid, sellerName: "A", title: "Tent", description: "", price: 80, currency: "USD", type: "sell", photos: [], status: "active", createdAt: ts() });

describe("users", () => {
  it("creates own public doc (no private fields); cannot create another's", async () => {
    await assertSucceeds(setDoc(doc(alice(), "users/alice"), { uid: "alice", displayName: "A", photoURL: null, updatedAt: ts(), interests: [], bio: "", subscription: { tier: "basic" }, followingCount: 0, followerCount: 0, createdAt: ts() }));
    await assertFails(setDoc(doc(bob(), "users/alice"), { uid: "alice", displayName: "x", photoURL: null, updatedAt: ts(), interests: [], bio: "", subscription: {}, followingCount: 0, followerCount: 0, createdAt: ts() }));
  });
  it("rejects private fields (email/phone) on the PUBLIC user doc", async () => {
    await assertFails(setDoc(doc(alice(), "users/alice"), { uid: "alice", email: "a@b.com", displayName: "A", photoURL: null, updatedAt: ts(), interests: [], bio: "", subscription: {}, followingCount: 0, followerCount: 0, createdAt: ts() }));
  });
  it("private subdoc is readable/writable ONLY by the owner", async () => {
    await assertSucceeds(setDoc(doc(alice(), "users/alice/private/data"), { email: "a@b.com", phoneNumber: null, fcmTokens: [], notificationPrefs: {}, updatedAt: ts() }));
    await assertSucceeds(getDoc(doc(alice(), "users/alice/private/data")));
    await assertFails(getDoc(doc(bob(), "users/alice/private/data")));   // other user cannot read your email/phone/tokens
    await assertFails(setDoc(doc(bob(), "users/alice/private/data"), { email: "evil@b.com" }));
  });
  it("blocks counter/subscription tampering on update", async () => {
    await setDoc(doc(alice(), "users/alice"), { uid: "alice", followerCount: 0, updatedAt: ts() });
    await assertFails(setDoc(doc(alice(), "users/alice"), { followerCount: 999 }, { merge: true }));
    await assertFails(setDoc(doc(alice(), "users/alice"), { subscription: { tier: "premium" } }, { merge: true }));
    await assertSucceeds(setDoc(doc(alice(), "users/alice"), { displayName: "New", updatedAt: ts() }, { merge: true }));
  });
  it("requires auth to read", async () => {
    await assertFails(getDoc(doc(anon(), "users/alice")));
  });
});

describe("posts", () => {
  it("creates a valid own post", async () => {
    await assertSucceeds(setDoc(doc(alice(), "posts/p1"), post("alice")));
  });
  it("rejects spoofed author", async () => {
    await assertFails(setDoc(doc(alice(), "posts/p2"), post("bob")));
  });
  it("rejects pre-inflated counts", async () => {
    await assertFails(setDoc(doc(alice(), "posts/p3"), { ...post("alice"), likeCount: 500 }));
  });
  it("rejects unknown/mass-assigned fields", async () => {
    await assertFails(setDoc(doc(alice(), "posts/p4"), { ...post("alice"), verified: true }));
  });
  it("rejects oversized title", async () => {
    await assertFails(setDoc(doc(alice(), "posts/p5"), { ...post("alice"), title: "x".repeat(400) }));
  });
  it("likes only as yourself; non-owner can't tamper counts on update", async () => {
    await setDoc(doc(alice(), "posts/p1"), post("alice"));
    await assertSucceeds(setDoc(doc(bob(), "posts/p1/likes/bob"), { uid: "bob", createdAt: ts() }));
    await assertFails(setDoc(doc(bob(), "posts/p1/likes/carol"), { uid: "carol", createdAt: ts() }));
    await assertFails(setDoc(doc(bob(), "posts/p1"), { ...post("alice"), title: "edited" })); // not owner
    await assertFails(setDoc(doc(alice(), "posts/p1"), { likeCount: 99 }, { merge: true })); // owner can't tamper count
  });
});

describe("tribes", () => {
  it("creates with memberCount 0; rejects non-zero", async () => {
    await assertSucceeds(setDoc(doc(alice(), "tribes/t1"), tribe("alice")));
    await assertFails(setDoc(doc(alice(), "tribes/t2"), { ...tribe("alice"), memberCount: 5 }));
  });
  it("join writes own member doc only", async () => {
    await setDoc(doc(alice(), "tribes/t1"), tribe("alice"));
    await assertSucceeds(setDoc(doc(bob(), "tribes/t1/members/bob"), { uid: "bob", role: "member", createdAt: ts() }));
    await assertFails(setDoc(doc(bob(), "tribes/t1/members/carol"), { uid: "carol", role: "member", createdAt: ts() }));
  });
});

describe("listings", () => {
  it("creates own listing; rejects spoofed seller", async () => {
    await assertSucceeds(setDoc(doc(alice(), "listings/l1"), listing("alice")));
    await assertFails(setDoc(doc(alice(), "listings/l2"), listing("bob")));
  });
});

describe("reports", () => {
  it("creates a report as self but cannot read the queue", async () => {
    await assertSucceeds(setDoc(doc(alice(), "reports/r1"), { reporterId: "alice", targetType: "post", targetId: "p1", targetOwnerId: "bob", reason: "spam", note: "", status: "open", createdAt: ts() }));
    await assertFails(getDoc(doc(alice(), "reports/r1")));
  });
});
