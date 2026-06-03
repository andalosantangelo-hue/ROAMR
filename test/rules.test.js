// Firestore security-rules unit tests — prove the security boundary.
// Run against the emulator:
//   npm i -D @firebase/rules-unit-testing
//   firebase emulators:exec --only firestore "vitest run test/rules.test.js"
import { describe, it, beforeAll, afterAll, expect } from "vitest";
import { readFileSync } from "fs";
import {
  initializeTestEnvironment, assertFails, assertSucceeds,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";

let env;
beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "roamr-rules-test",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});
afterAll(async () => { await env?.cleanup(); });

const alice = () => env.authenticatedContext("alice").firestore();
const bob = () => env.authenticatedContext("bob").firestore();
const anon = () => env.unauthenticatedContext().firestore();

describe("users", () => {
  it("a user can create their own doc", async () => {
    await assertSucceeds(setDoc(doc(alice(), "users/alice"), { uid: "alice" }));
  });
  it("a user cannot write someone else's doc", async () => {
    await assertFails(setDoc(doc(bob(), "users/alice"), { uid: "alice" }));
  });
  it("anonymous cannot read user docs", async () => {
    await assertFails(getDoc(doc(anon(), "users/alice")));
  });
  it("a user cannot tamper with server-maintained counters", async () => {
    await setDoc(doc(alice(), "users/alice"), { uid: "alice", followerCount: 0 });
    await assertFails(setDoc(doc(alice(), "users/alice"), { followerCount: 999 }, { merge: true }));
  });
});

describe("posts", () => {
  it("can create a post you author with zero counts", async () => {
    await assertSucceeds(setDoc(doc(alice(), "posts/p1"), { authorId: "alice", likeCount: 0, commentCount: 0 }));
  });
  it("cannot create a post spoofing another author", async () => {
    await assertFails(setDoc(doc(alice(), "posts/p2"), { authorId: "bob", likeCount: 0, commentCount: 0 }));
  });
  it("cannot create a post with a pre-inflated like count", async () => {
    await assertFails(setDoc(doc(alice(), "posts/p3"), { authorId: "alice", likeCount: 500, commentCount: 0 }));
  });
  it("can like as yourself but not as someone else", async () => {
    await assertSucceeds(setDoc(doc(alice(), "posts/p1/likes/alice"), { uid: "alice" }));
    await assertFails(setDoc(doc(alice(), "posts/p1/likes/bob"), { uid: "bob" }));
  });
});

describe("reports", () => {
  it("can file a report as yourself, but cannot read the queue", async () => {
    await assertSucceeds(setDoc(doc(alice(), "reports/r1"), { reporterId: "alice", targetType: "post", targetId: "p1" }));
    await assertFails(getDoc(doc(alice(), "reports/r1")));
  });
});
