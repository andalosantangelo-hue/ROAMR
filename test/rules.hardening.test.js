// Security-rules tests for the hardening pass. Every attack found in the beta bug run
// is pinned here as a test that must stay blocked, next to the legitimate action it
// must not break. Run with `npm run test:rules` (Firestore + Storage emulators).
import { describe, it, beforeAll, afterAll, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, deleteObject, listAll } from "firebase/storage";

let env;
beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "roamr-rules-hardening",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
    storage: { rules: readFileSync("storage.rules", "utf8") },
  });
});
afterAll(async () => { await env?.cleanup(); });
beforeEach(async () => { await env.clearFirestore(); await env.clearStorage(); });

const as = (uid) => env.authenticatedContext(uid);
const alice = () => as("alice").firestore();
const bob = () => as("bob").firestore();
const carol = () => as("carol").firestore();
const ts = () => serverTimestamp();
// Seed docs the way the server/app would, bypassing rules.
const seed = (fn) => env.withSecurityRulesDisabled((ctx) => fn(ctx.firestore()));

const post = (uid) => ({ authorId: uid, authorName: "A", authorPhotoURL: null, title: "Hike", location: "", photo: null, rating: 4, likeCount: 0, commentCount: 0, createdAt: ts() });
const tribe = (uid) => ({ name: "Trail Crew", img: null, category: "outdoor", memberCount: 0, ownerId: uid, createdAt: ts() });
const listing = (uid) => ({ sellerId: uid, sellerName: "A", title: "Tent", description: "", price: 80, currency: "USD", type: "sell", photos: [], status: "active", createdAt: ts() });
const userDoc = (uid, extra = {}) => ({ uid, displayName: uid, photoURL: null, interests: ["outdoor"], bio: "", subscription: { tier: "basic" }, followingCount: 0, followerCount: 0, createdAt: ts(), ...extra });
const tid = (a, b) => [a, b].sort().join("__");
const thread = (a, b) => ({ participants: [a, b].sort(), participantNames: {}, participantPhotos: {}, lastMessage: "", lastAt: ts(), createdAt: ts() });
const plan = (uid) => ({ ownerId: uid, ownerName: "A", objective: "Longs Peak", activity: "", area: "", startAt: ts(), expectedReturnAt: ts(), partners: [], partnerNames: [], emergencyContact: null, shareMedical: false, medical: null, lastKnownLocation: null, status: "planned", checkedInAt: null, escalatedAt: null, graceMins: 60, createdAt: ts() });

describe("field types (one bad doc must not crash every client's feed)", () => {
  it("rejects a post whose location is an object, not text", async () => {
    await assertFails(setDoc(doc(alice(), "posts/bad1"), { ...post("alice"), location: { x: 1 } }));
  });
  it("rejects non-string authorName and out-of-range rating", async () => {
    await assertFails(setDoc(doc(alice(), "posts/bad2"), { ...post("alice"), authorName: ["A"] }));
    await assertFails(setDoc(doc(alice(), "posts/bad3"), { ...post("alice"), rating: 99 }));
  });
  it("rejects image URLs outside our Storage bucket (tracking pixels)", async () => {
    await assertFails(setDoc(doc(alice(), "posts/bad4"), { ...post("alice"), photo: "https://evil.example/pixel.gif" }));
    await assertSucceeds(setDoc(doc(alice(), "posts/ok1"), { ...post("alice"), photo: "https://firebasestorage.googleapis.com/v0/b/x/o/posts%2Falice%2F1.jpg" }));
  });
  it("re-validates on update (can't sneak a bad field in later)", async () => {
    await setDoc(doc(alice(), "posts/p1"), post("alice"));
    await assertFails(setDoc(doc(alice(), "posts/p1"), { location: { x: 1 } }, { merge: true }));
  });
  it("rejects an empty title", async () => {
    await assertFails(setDoc(doc(alice(), "posts/bad5"), { ...post("alice"), title: "" }));
  });
});

describe("rich posts (body, geo, media)", () => {
  const FS = "https://firebasestorage.googleapis.com/v0/b/x/o/posts%2Falice%2F";
  const media = [
    { type: "image", url: `${FS}1.jpg`, w: 4096, h: 2048, is360: true },
    { type: "video", url: `${FS}2.mp4`, poster: `${FS}2-poster.jpg`, w: 3840, h: 2160, duration: 120 },
    { type: "audio", url: `${FS}3.m4a`, duration: 30 },
  ];
  it("accepts a story, coordinates and own-bucket media", async () => {
    await assertSucceeds(setDoc(doc(alice(), "posts/rich1"), { ...post("alice"), body: "Great day out.", geo: { lat: 39.7, lng: -105.2 }, media }));
  });
  it("accepts an activity with coordinates", async () => {
    await assertSucceeds(setDoc(doc(alice(), "activities/a1"), { authorId: "alice", authorName: "A", authorPhotoURL: null, text: "Hike?", photo: null, location: "Golden", geo: { lat: 39.7, lng: -105.2 }, when: null, skillLevel: "All Levels", dmOpen: true, attendeeCount: 0, recentAttendees: [], likeCount: 0, commentCount: 0, createdAt: ts() }));
  });
  it("rejects a body over 2,200 characters", async () => {
    await assertFails(setDoc(doc(alice(), "posts/rich2"), { ...post("alice"), body: "x".repeat(2201) }));
  });
  it("rejects malformed geo", async () => {
    await assertFails(setDoc(doc(alice(), "posts/rich3"), { ...post("alice"), geo: { lat: "39", lng: -105 } }));
    await assertFails(setDoc(doc(alice(), "posts/rich4"), { ...post("alice"), geo: { lat: 1, lng: 2, x: 3 } }));
  });
  it("accepts the full 10 media items (stays under the 1000-expression limit)", async () => {
    await assertSucceeds(setDoc(doc(alice(), "posts/rich10"), { ...post("alice"), body: "x".repeat(2200), geo: { lat: 1, lng: 2 }, media: Array(10).fill(media[1]) }));
  });
  it("rejects more than 10 media items", async () => {
    await assertFails(setDoc(doc(alice(), "posts/rich5"), { ...post("alice"), media: Array(11).fill(media[0]) }));
  });
});

describe("profiles", () => {
  it("caps text sizes (a 900 KB bio used to be accepted)", async () => {
    await seed((db) => setDoc(doc(db, "users/alice"), userDoc("alice")));
    await assertFails(setDoc(doc(alice(), "users/alice"), { bio: "x".repeat(301) }, { merge: true }));
    await assertFails(setDoc(doc(alice(), "users/alice"), { displayName: "A".repeat(41) }, { merge: true }));
    await assertSucceeds(setDoc(doc(alice(), "users/alice"), { bio: "Sunrise missions only." }, { merge: true }));
  });
  it("a completely filled-out profile saves (stays under the 1000-expression rules limit)", async () => {
    await seed((db) => setDoc(doc(db, "users/alice"), userDoc("alice")));
    const url = "https://firebasestorage.googleapis.com/v0/b/x/o/avatars%2Falice%2Fa.jpg";
    const full = {
      displayName: "Maya Rivers", bio: "b".repeat(300), location: "Denver, CO", photos: Array(6).fill(url), photoURL: url,
      languages: ["English", "Spanish"], pets: "Dog-friendly", interests: ["outdoor", "water", "snow"], subInterests: ["Hiking", "Kayaking"],
      skillLevels: { outdoor: "Advanced", water: "Beginner" }, experience: { outdoor: "5–10 yrs" },
      terrain: ["Alpine", "Desert"], intensity: "Hard", pace: "Fast", risk: "Moderate", type2: "Love it", tripDuration: ["Day trips", "Multi-day"],
      planning: "Planner", fitness: "Athletic", trainingFor: "Rainier in July", availability: ["Weekends"], seasons: ["Summer", "Winter"],
      leadTime: "A week", willTravel: "Anywhere", style: "Fast and light", lookingFor: ["Partners"], partnerWants: ["Punctual"],
      dealbreakers: ["Flaky"], certifications: ["WFR"], gearShare: ["Rope"], bucketList: Array(12).fill("Climb something"),
      recentTrips: "r".repeat(300), prompts: Array(4).fill({ q: "My next adventure is…", a: "Sawtooths" }),
      whoCanMessage: "verified", verifiedOnly: true, womenOnly: false, updatedAt: ts(),
    };
    await assertSucceeds(setDoc(doc(alice(), "users/alice"), full, { merge: true }));
    await assertSucceeds(setDoc(doc(alice(), "users/alice"), { ...full, bio: "edited" }, { merge: true }));
  });
  it("rejects a non-text display name or bio (shown across the app)", async () => {
    await seed((db) => setDoc(doc(db, "users/alice"), userDoc("alice")));
    await assertFails(setDoc(doc(alice(), "users/alice"), { displayName: { x: 1 } }, { merge: true }));
    await assertFails(setDoc(doc(alice(), "users/alice"), { bio: ["x"] }, { merge: true }));
    await assertFails(setDoc(doc(alice(), "users/alice"), { bucketList: Array(13).fill("x") }, { merge: true }));
  });
  it("can't delete own profile doc to wipe bad ratings (deletion is server-side)", async () => {
    await seed((db) => setDoc(doc(db, "users/alice"), userDoc("alice", { ratingAvg: 1.2, ratingCount: 9 })));
    await assertFails(deleteDoc(doc(alice(), "users/alice")));
  });
  it("gender can't be newly written to the public profile; it lives in private data", async () => {
    await seed((db) => setDoc(doc(db, "users/alice"), userDoc("alice")));
    await assertFails(setDoc(doc(alice(), "users/alice"), { gender: "woman" }, { merge: true }));
    await assertSucceeds(setDoc(doc(alice(), "users/alice/private/data"), { gender: "woman" }, { merge: true }));
    await assertFails(getDoc(doc(bob(), "users/alice/private/data")));
  });
  it("profiles with a legacy public gender can still be edited", async () => {
    await seed((db) => setDoc(doc(db, "users/alice"), userDoc("alice", { gender: "woman" })));
    await assertSucceeds(setDoc(doc(alice(), "users/alice"), { bio: "still works" }, { merge: true }));
  });
});

describe("comments", () => {
  it("authors can edit the text but can't rewrite who wrote it", async () => {
    await seed(async (db) => {
      await setDoc(doc(db, "posts/p1"), post("bob"));
      await setDoc(doc(db, "posts/p1/comments/c1"), { authorId: "alice", authorName: "A", authorPhotoURL: null, text: "nice", createdAt: ts() });
    });
    await assertFails(setDoc(doc(alice(), "posts/p1/comments/c1"), { authorId: "bob", authorName: "Bob" }, { merge: true }));
    await assertSucceeds(setDoc(doc(alice(), "posts/p1/comments/c1"), { text: "nice!!" }, { merge: true }));
  });
  it("can't comment on a post that doesn't exist", async () => {
    await assertFails(setDoc(doc(alice(), "posts/ghost/comments/c1"), { authorId: "alice", authorName: "A", authorPhotoURL: null, text: "hi", createdAt: ts() }));
  });
  it("the post's author can remove comments on their own post", async () => {
    await seed(async (db) => {
      await setDoc(doc(db, "posts/p1"), post("bob"));
      await setDoc(doc(db, "posts/p1/comments/c1"), { authorId: "alice", authorName: "A", authorPhotoURL: null, text: "spam", createdAt: ts() });
    });
    await assertSucceeds(deleteDoc(doc(bob(), "posts/p1/comments/c1")));
    await assertFails(deleteDoc(doc(carol(), "posts/p1/comments/c1")));
  });
});

describe("direct messages", () => {
  beforeEach(async () => {
    await seed(async (db) => {
      await setDoc(doc(db, "users/alice"), userDoc("alice"));
      await setDoc(doc(db, "users/bob"), userDoc("bob"));
    });
  });
  const open = (db) => setDoc(doc(db, `threads/${tid("alice", "bob")}`), thread("alice", "bob"));

  it("probing a thread that doesn't exist yet is allowed (the Message button needs it)", async () => {
    await assertSucceeds(getDoc(doc(alice(), `threads/${tid("alice", "bob")}`)));
  });
  it("opens a well-formed thread", async () => {
    await assertSucceeds(open(alice()));
  });
  it("rejects spoofed sender names ('ROAMR Safety Team')", async () => {
    await assertFails(setDoc(doc(alice(), `threads/${tid("alice", "bob")}`), { ...thread("alice", "bob"), participantNames: { alice: "ROAMR Safety Team" } }));
  });
  it("rejects duplicate threads under random ids, and threads with yourself", async () => {
    await assertFails(setDoc(doc(alice(), "threads/random123"), thread("alice", "bob")));
    await assertFails(setDoc(doc(alice(), "threads/alice__alice"), { ...thread("alice", "bob"), participants: ["alice", "alice"] }));
  });
  it("other people can't read the thread", async () => {
    await seed((db) => open(db));
    await assertFails(getDoc(doc(carol(), `threads/${tid("alice", "bob")}`)));
  });
  it("enforces 'verified members only'", async () => {
    await seed((db) => setDoc(doc(db, "users/bob"), userDoc("bob", { whoCanMessage: "verified" })));
    await assertFails(open(alice()));
    await seed((db) => setDoc(doc(db, "users/alice"), userDoc("alice", { verified: true })));
    await assertSucceeds(open(alice()));
  });
  it("enforces 'people I follow'", async () => {
    await seed((db) => setDoc(doc(db, "users/bob"), userDoc("bob", { whoCanMessage: "following" })));
    await assertFails(open(alice()));
    await seed((db) => setDoc(doc(db, "users/bob/following/alice"), { targetUid: "alice", createdAt: ts() }));
    await assertSucceeds(open(alice()));
  });
  it("enforces women-only messaging using the sender's private gender", async () => {
    await seed((db) => setDoc(doc(db, "users/bob"), userDoc("bob", { womenOnly: true })));
    await assertFails(open(alice()));
    await seed((db) => setDoc(doc(db, "users/alice/private/data"), { gender: "woman" }));
    await assertSucceeds(open(alice()));
  });
  it("blocks DMs in both directions", async () => {
    await seed((db) => setDoc(doc(db, "users/bob/blocked/alice"), { targetUid: "alice", createdAt: ts() }));
    await assertFails(open(alice()));
  });
  it("participants may only update lastMessage/lastAt", async () => {
    await seed((db) => open(db));
    await assertSucceeds(setDoc(doc(alice(), `threads/${tid("alice", "bob")}`), { lastMessage: "hey", lastAt: ts() }, { merge: true }));
    await assertFails(setDoc(doc(alice(), `threads/${tid("alice", "bob")}`), { participantNames: { alice: "Admin" } }, { merge: true }));
  });
});

describe("tribes", () => {
  it("can't self-assign the owner role in someone else's tribe", async () => {
    await seed((db) => setDoc(doc(db, "tribes/t1"), tribe("alice")));
    await assertFails(setDoc(doc(bob(), "tribes/t1/members/bob"), { uid: "bob", role: "owner", createdAt: ts() }));
    await assertSucceeds(setDoc(doc(bob(), "tribes/t1/members/bob"), { uid: "bob", role: "member", createdAt: ts() }));
    await assertSucceeds(setDoc(doc(alice(), "tribes/t1/members/alice"), { uid: "alice", role: "owner", createdAt: ts() }));
  });
  it("the owner can remove a member; other members can't", async () => {
    await seed(async (db) => {
      await setDoc(doc(db, "tribes/t1"), tribe("alice"));
      await setDoc(doc(db, "tribes/t1/members/bob"), { uid: "bob", role: "member", createdAt: ts() });
    });
    await assertFails(deleteDoc(doc(carol(), "tribes/t1/members/bob")));
    await assertSucceeds(deleteDoc(doc(alice(), "tribes/t1/members/bob")));
  });
});

describe("listings", () => {
  it("rejects string, negative or absurd prices", async () => {
    await assertFails(setDoc(doc(alice(), "listings/l1"), { ...listing("alice"), price: "80" }));
    await assertFails(setDoc(doc(alice(), "listings/l2"), { ...listing("alice"), price: -5 }));
    await assertFails(setDoc(doc(alice(), "listings/l3"), { ...listing("alice"), price: 1e9 }));
    await assertSucceeds(setDoc(doc(alice(), "listings/l4"), listing("alice")));
  });
});

describe("trip plans", () => {
  it("other users can't read your plan", async () => {
    await seed((db) => setDoc(doc(db, "tripPlans/tp1"), plan("alice")));
    await assertFails(getDoc(doc(bob(), "tripPlans/tp1")));
    await assertSucceeds(getDoc(doc(alice(), "tripPlans/tp1")));
  });
  it("owner can't mark adventures credited (stops status-cycling inflation)", async () => {
    await seed((db) => setDoc(doc(db, "tripPlans/tp1"), plan("alice")));
    await assertFails(setDoc(doc(alice(), "tripPlans/tp1"), { adventureCredited: false, status: "safe" }, { merge: true }));
    await assertSucceeds(setDoc(doc(alice(), "tripPlans/tp1"), { status: "active" }, { merge: true }));
  });
  it("caps partners and rejects unknown statuses", async () => {
    await assertFails(setDoc(doc(alice(), "tripPlans/tp2"), { ...plan("alice"), partners: Array.from({ length: 11 }, (_, i) => `u${i}`) }));
    await assertFails(setDoc(doc(alice(), "tripPlans/tp3"), { ...plan("alice"), status: "hacked" }));
  });
});

describe("storage", () => {
  const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const st = (uid) => (uid ? as(uid) : env.unauthenticatedContext()).storage();
  it("owners can upload images into their own folder only", async () => {
    await assertSucceeds(uploadBytes(ref(st("alice"), "avatars/alice/a.png"), png, { contentType: "image/png" }));
    await assertFails(uploadBytes(ref(st("alice"), "avatars/bob/evil.png"), png, { contentType: "image/png" }));
    await assertFails(uploadBytes(ref(st("alice"), "avatars/alice/x.html"), png, { contentType: "text/html" }));
  });
  it("post media allows video and audio, other folders stay image-only", async () => {
    await assertSucceeds(uploadBytes(ref(st("alice"), "posts/alice/v.mp4"), png, { contentType: "video/mp4" }));
    await assertSucceeds(uploadBytes(ref(st("alice"), "posts/alice/a.m4a"), png, { contentType: "audio/mp4" }));
    await assertFails(uploadBytes(ref(st("alice"), "avatars/alice/v.mp4"), png, { contentType: "video/mp4" }));
  });
  it("owners can delete their own files (account deletion needs this)", async () => {
    await assertSucceeds(uploadBytes(ref(st("alice"), "posts/alice/p.png"), png, { contentType: "image/png" }));
    await assertSucceeds(deleteObject(ref(st("alice"), "posts/alice/p.png")));
  });
  it("nobody can list another user's uploads", async () => {
    await assertFails(listAll(ref(st(null), "avatars/alice")));
    await assertFails(listAll(ref(st("bob"), "avatars/alice")));
  });
});
