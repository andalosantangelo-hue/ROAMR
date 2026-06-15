/**
 * ROAMR demo-data seeder.
 * Populates Firestore with sample explorers, posts, activities, tribes, and listings
 * so a fresh public link looks alive. Safe to re-run (uses fixed document ids).
 *
 * Run it from the app root (where firestore.rules lives):
 *   1) npm i firebase-admin
 *   2) Download a service-account key from
 *      Firebase Console -> Project settings -> Service accounts -> Generate new private key
 *   3) export GOOGLE_APPLICATION_CREDENTIALS="/absolute/path/serviceAccount.json"
 *      (Windows PowerShell: $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\serviceAccount.json")
 *   4) node scripts/seed-demo.mjs
 *
 * To remove demo data later:  node scripts/seed-demo.mjs --clear
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();
const clear = process.argv.includes("--clear");

const AV = (n) => `https://i.pravatar.cc/150?img=${n}`;
const PH = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=70`;

const users = [
  { id: "demo_maya",  displayName: "Maya Rivers",   bio: "Trail runner & weekend summit chaser. Always down for sunrise hikes.", location: "Boulder, CO", interests: ["outdoor", "nature"], photoURL: AV(47), followerCount: 128, followingCount: 86 },
  { id: "demo_diego", displayName: "Diego Park",    bio: "Sea kayaker and certified diver. Salt water in my veins.",            location: "San Diego, CA", interests: ["water", "outdoor"], photoURL: AV(12), followerCount: 64, followingCount: 51 },
  { id: "demo_sage",  displayName: "Sage Bennett",  bio: "Powder days only. Backcountry split-boarder.",                         location: "Salt Lake City, UT", interests: ["snow", "outdoor"], photoURL: AV(32), followerCount: 203, followingCount: 99 },
  { id: "demo_kai",   displayName: "Kai Thompson",  bio: "Gravel grinder & bikepacker. 10,000 ft of climbing is a good Tuesday.", location: "Bend, OR", interests: ["wheel", "outdoor"], photoURL: AV(15), followerCount: 88, followingCount: 73 },
  { id: "demo_nora",  displayName: "Nora Vance",    bio: "Wildlife photographer chasing golden hour and good light.",            location: "Jackson, WY", interests: ["nature", "outdoor"], photoURL: AV(45), followerCount: 156, followingCount: 64 },
  { id: "demo_eli",   displayName: "Eli Brooks",    bio: "Rock climber and camp-coffee enthusiast.",                            location: "Bishop, CA", interests: ["outdoor"], photoURL: AV(68), followerCount: 41, followingCount: 38 },
];

const posts = [
  { id: "demo_p1", authorId: "demo_maya",  title: "Sunrise on Bear Peak — worth the 4am alarm", location: "Bear Peak · Boulder", photo: PH("photo-1551632811-561732d1e306"), rating: 5 },
  { id: "demo_p2", authorId: "demo_diego", title: "Glassy paddle out to the sea caves",            location: "La Jolla · San Diego", photo: PH("photo-1502680390469-be75c86b636f"), rating: 5 },
  { id: "demo_p3", authorId: "demo_sage",  title: "First tracks, knee-deep blower",               location: "Wasatch Backcountry", photo: PH("photo-1551524559-8af4e6624178"), rating: 4 },
  { id: "demo_p4", authorId: "demo_kai",   title: "120 miles of gravel, one flat, zero regrets",  location: "Oregon Outback", photo: PH("photo-1500530855697-b586d89ba3ee"), rating: 5 },
  { id: "demo_p5", authorId: "demo_nora",  title: "Bull moose at first light",                    location: "Grand Teton NP", photo: PH("photo-1441974231531-c6227db76b6e"), rating: 5 },
  { id: "demo_p6", authorId: "demo_eli",   title: "Sticky granite and perfect temps",             location: "Buttermilks · Bishop", photo: PH("photo-1522163182402-834f871fd851"), rating: 4 },
];

const activities = [
  { id: "demo_a1", authorId: "demo_maya",  text: "Sunrise hike up Green Mountain this Saturday — meeting at the trailhead 5:30am. All paces welcome!", location: "Green Mountain · Boulder", skillLevel: "Beginner", dmOpen: true },
  { id: "demo_a2", authorId: "demo_diego", text: "Sunday sea-kayak to the caves, then tacos. Need your own boat or rental.", location: "La Jolla Shores", skillLevel: "Intermediate", dmOpen: true },
  { id: "demo_a3", authorId: "demo_kai",   text: "Mid-week gravel spin, ~40mi tempo. Looking for 2-3 to share pulls.", location: "Cascade Lakes Hwy", skillLevel: "Advanced", dmOpen: true },
  { id: "demo_a4", authorId: "demo_sage",  text: "Dawn patrol split-board mission if the avy report stays green. Beacon/shovel/probe required.", location: "Wasatch", skillLevel: "Advanced", dmOpen: false },
  { id: "demo_a5", authorId: "demo_eli",   text: "Chill bouldering session + camp coffee. Bringing extra pads.", location: "Buttermilks", skillLevel: "Beginner", dmOpen: true },
];

const tribes = [
  { id: "demo_t1", name: "Front Range Trail Crew", ownerId: "demo_maya",  categories: ["outdoor", "nature"], location: "Boulder, CO", description: "Weekly hikes, trail runs, and peak baggers around the Front Range.", img: PH("photo-1454496522488-7a8e488e8606"), memberCount: 42 },
  { id: "demo_t2", name: "Pacific Paddlers",       ownerId: "demo_diego", categories: ["water"],            location: "San Diego, CA", description: "Sea kayaking, SUP, and coastal clean-ups.", img: PH("photo-1502933691298-84fc14542831"), memberCount: 27 },
  { id: "demo_t3", name: "Powder Hounds",          ownerId: "demo_sage",  categories: ["snow"],             location: "Salt Lake City, UT", description: "Backcountry and resort crew. Safety first, faceshots second.", img: PH("photo-1551524559-8af4e6624178"), memberCount: 63 },
  { id: "demo_t4", name: "Gravel & Grit",          ownerId: "demo_kai",   categories: ["wheel"],            location: "Bend, OR", description: "Long dirt roads, big climbs, and post-ride coffee.", img: PH("photo-1500530855697-b586d89ba3ee"), memberCount: 35 },
];

const listings = [
  { id: "demo_l1", sellerId: "demo_eli",   sellerName: "Eli Brooks",   title: "Black Diamond Mondo crash pad", description: "Lightly used, super plush. Great for highballs.", price: 180, type: "sell", category: "Climbing", photos: [PH("photo-1522163182402-834f871fd851")] },
  { id: "demo_l2", sellerId: "demo_diego", sellerName: "Diego Park",   title: "Sea kayak — 12ft touring",       description: "Stable and fast. Paddle + skirt included.", price: 45, type: "rent", category: "Water Sports", photos: [PH("photo-1502680390469-be75c86b636f")] },
  { id: "demo_l3", sellerId: "demo_sage",  sellerName: "Sage Bennett", title: "Splitboard package, 158",        description: "Board, skins, and bindings. One season on it.", price: 520, type: "sell", category: "Snow Sports", photos: [PH("photo-1551524559-8af4e6624178")] },
  { id: "demo_l4", sellerId: "demo_kai",   sellerName: "Kai Thompson", title: "Gravel bike, 56cm",              description: "1x11, tubeless, ready to rip. Rent by the weekend.", price: 60, type: "rent", category: "Cycling", photos: [PH("photo-1500530855697-b586d89ba3ee")] },
  { id: "demo_l5", sellerId: "demo_maya",  sellerName: "Maya Rivers",  title: "2-person ultralight tent",       description: "Freestanding, 2.1 lbs. Used twice.", price: 230, type: "sell", category: "Camping", photos: [PH("photo-1504280390367-361c6d9f38f4")] },
];

const follows = [
  ["demo_eli", "demo_maya"], ["demo_kai", "demo_maya"], ["demo_nora", "demo_sage"],
  ["demo_diego", "demo_maya"], ["demo_maya", "demo_nora"], ["demo_sage", "demo_kai"],
];

async function run() {
  if (clear) {
    const all = [
      ...users.map((u) => db.doc(`users/${u.id}`)),
      ...posts.map((p) => db.doc(`posts/${p.id}`)),
      ...activities.map((a) => db.doc(`activities/${a.id}`)),
      ...tribes.map((t) => db.doc(`tribes/${t.id}`)),
      ...listings.map((l) => db.doc(`listings/${l.id}`)),
    ];
    for (const ref of all) await ref.delete().catch(() => {});
    console.log(`Cleared ${all.length} demo documents.`);
    return;
  }

  let n = 0;
  for (const u of users) {
    await db.doc(`users/${u.id}`).set({
      uid: u.id, displayName: u.displayName, bio: u.bio, location: u.location,
      interests: u.interests, photoURL: u.photoURL,
      followerCount: u.followerCount, followingCount: u.followingCount,
      subscription: "free", createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true }); n++;
  }
  for (const p of posts) {
    const a = users.find((u) => u.id === p.authorId);
    await db.doc(`posts/${p.id}`).set({
      authorId: p.authorId, authorName: a.displayName, authorPhotoURL: a.photoURL,
      title: p.title, location: p.location, photo: p.photo, rating: p.rating,
      likeCount: Math.floor(Math.random() * 30) + 3, commentCount: Math.floor(Math.random() * 8),
      createdAt: FieldValue.serverTimestamp(),
    }, { merge: true }); n++;
  }
  for (const a of activities) {
    const u = users.find((x) => x.id === a.authorId);
    await db.doc(`activities/${a.id}`).set({
      authorId: a.authorId, authorName: u.displayName, authorPhotoURL: u.photoURL,
      text: a.text, location: a.location, skillLevel: a.skillLevel, dmOpen: a.dmOpen,
      when: null, photo: null, attendeeCount: Math.floor(Math.random() * 6),
      recentAttendees: [], likeCount: Math.floor(Math.random() * 12), commentCount: Math.floor(Math.random() * 5),
      createdAt: FieldValue.serverTimestamp(),
    }, { merge: true }); n++;
  }
  for (const t of tribes) {
    await db.doc(`tribes/${t.id}`).set({
      name: t.name, ownerId: t.ownerId, categories: t.categories, location: t.location,
      description: t.description, img: t.img, memberCount: t.memberCount, createdAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    await db.doc(`tribes/${t.id}/members/${t.ownerId}`).set({ uid: t.ownerId, role: "owner", createdAt: FieldValue.serverTimestamp() }, { merge: true });
    n++;
  }
  for (const l of listings) {
    await db.doc(`listings/${l.id}`).set({
      sellerId: l.sellerId, sellerName: l.sellerName, title: l.title, description: l.description,
      price: l.price, currency: "USD", type: l.type, category: l.category, photos: l.photos,
      status: "active", createdAt: FieldValue.serverTimestamp(),
    }, { merge: true }); n++;
  }
  for (const [from, to] of follows) {
    await db.doc(`users/${from}/following/${to}`).set({ targetUid: to, createdAt: FieldValue.serverTimestamp() }, { merge: true }); n++;
  }
  console.log(`Seeded ${n} demo documents. Open the app to see a populated feed, activities, tribes, and marketplace.`);
}

run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
