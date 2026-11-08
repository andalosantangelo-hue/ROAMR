// Security-rules tests for Verified Guides: the application is private to the guide,
// can only ever be submitted as "pending", and the public users/{uid}.guide badge is
// server-only. Run with `npm run test:rules` (Firestore emulator).
import { describe, it, beforeAll, afterAll, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

let env;
beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "roamr-rules-guides",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});
afterAll(async () => { await env?.cleanup(); });
beforeEach(async () => { await env.clearFirestore(); });

const alice = () => env.authenticatedContext("alice").firestore();
const bob = () => env.authenticatedContext("bob").firestore();
const anon = () => env.unauthenticatedContext().firestore();
const ts = () => serverTimestamp();
const seed = (fn) => env.withSecurityRulesDisabled((ctx) => fn(ctx.firestore()));

// The exact shape submitGuideApplication writes.
const app = (uid, extra = {}) => ({
  uid, fullName: "Sam Rivers", specialties: ["Fly fishing"], region: "Bozeman, MT", experienceYears: 6,
  certifications: "WFR", license: "MT Outfitter Guide #12345", insuranceProvider: "Outdoor Underwriters",
  insurancePolicy: "OU-998877", insuranceExpires: "2030-06-30", website: "", bio: "",
  status: "pending", createdAt: ts(), ...extra,
});
const userDoc = (uid, extra = {}) => ({ uid, displayName: uid, photoURL: null, interests: ["outdoor"], bio: "", subscription: { tier: "basic" }, followingCount: 0, followerCount: 0, createdAt: ts(), ...extra });

describe("guideApplications", () => {
  it("a guide can submit and read their own pending application", async () => {
    await assertSucceeds(setDoc(doc(alice(), "guideApplications/alice"), app("alice")));
    await assertSucceeds(getDoc(doc(alice(), "guideApplications/alice")));
  });

  it("nobody else can read it (licence and insurance details stay private)", async () => {
    await seed((db) => setDoc(doc(db, "guideApplications/alice"), app("alice")));
    await assertFails(getDoc(doc(bob(), "guideApplications/alice")));
    await assertFails(getDoc(doc(anon(), "guideApplications/alice")));
  });

  it("cannot self-approve or apply for someone else", async () => {
    await assertFails(setDoc(doc(alice(), "guideApplications/alice"), app("alice", { status: "approved" })));
    await assertFails(setDoc(doc(bob(), "guideApplications/alice"), app("alice")));
    await assertFails(setDoc(doc(alice(), "guideApplications/alice"), app("bob")));
  });

  it("requires licence, insurance and at least one specialty; rejects extra fields", async () => {
    await assertFails(setDoc(doc(alice(), "guideApplications/alice"), app("alice", { license: "" })));
    await assertFails(setDoc(doc(alice(), "guideApplications/alice"), app("alice", { insurancePolicy: "" })));
    await assertFails(setDoc(doc(alice(), "guideApplications/alice"), app("alice", { specialties: [] })));
    await assertFails(setDoc(doc(alice(), "guideApplications/alice"), app("alice", { experienceYears: 2.5 })));
    await assertFails(setDoc(doc(alice(), "guideApplications/alice"), app("alice", { verified: true })));
  });

  it("can resubmit after a rejection, but an approved application is locked", async () => {
    await seed((db) => setDoc(doc(db, "guideApplications/alice"), app("alice", { status: "rejected" })));
    await assertSucceeds(setDoc(doc(alice(), "guideApplications/alice"), app("alice", { region: "Missoula, MT" })));
    await seed((db) => setDoc(doc(db, "guideApplications/alice"), app("alice", { status: "approved" })));
    await assertFails(setDoc(doc(alice(), "guideApplications/alice"), app("alice", { region: "Anywhere" })));
  });

  it("cannot be deleted from the client", async () => {
    await seed((db) => setDoc(doc(db, "guideApplications/alice"), app("alice")));
    await assertFails(deleteDoc(doc(alice(), "guideApplications/alice")));
  });
});

describe("users.guide badge (server-only)", () => {
  it("cannot be granted on create or by an update", async () => {
    await assertFails(setDoc(doc(alice(), "users/alice"), userDoc("alice", { guide: { verified: true } })));
    await seed((db) => setDoc(doc(db, "users/alice"), userDoc("alice")));
    await assertFails(setDoc(doc(alice(), "users/alice"), { guide: { verified: true, specialties: ["Fly fishing"] } }, { merge: true }));
  });

  it("a verified guide can still edit the rest of their profile, but not the badge", async () => {
    await seed((db) => setDoc(doc(db, "users/alice"), userDoc("alice", { guide: { verified: true, specialties: ["Fly fishing"], region: "Bozeman, MT" } })));
    await assertSucceeds(setDoc(doc(alice(), "users/alice"), { bio: "Drift trips on the Madison.", updatedAt: ts() }, { merge: true }));
    await assertFails(setDoc(doc(alice(), "users/alice"), { guide: { verified: true, specialties: ["Everything"] } }, { merge: true }));
  });
});
