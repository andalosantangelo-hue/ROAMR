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
  { id: "demo_maya",  displayName: "Maya Rivers",   bio: "Trail runner & weekend summit chaser. Always down for sunrise hikes.", location: "Boulder, CO", interests: ["outdoor", "nature"], photoURL: AV(47), skillLevels: { outdoor: "Advanced", nature: "Intermediate" }, experience: { outdoor: "5\u201310 yrs" }, terrain: ["Alpine", "Forest & trail"], intensity: "strenuous", risk: "measured", type2: "love", pace: "hard", planning: "planner", fitness: "training", trainingFor: "Nolans 14", tripDuration: ["Day trips", "Multi-day"], availability: ["Weekends", "Weekday mornings"], seasons: ["Spring", "Summer", "Fall"], leadTime: "few-days", willTravel: "roadtrip", languages: ["English", "Spanish"], pets: "dog", lookingFor: ["Activity partners", "A regular crew"], partnerWants: ["Reliable & on time", "Safety-first mindset"], dealbreakers: ["No-shows / flakes"], certifications: ["Wilderness First Aid (WFA)"], gearShare: ["Tent", "Camp stove"], prompts: [{ q: "My next adventure is\u2026", a: "Linking up the Indian Peaks in a single push." }, { q: "Looking for partners who\u2026", a: "are stoked at 4am and don\u2019t bail when it drizzles." }], bucketList: ["Thru-hike the JMT", "Climb the Grand Teton"], recentTrips: "Sawtooths loop, a dawn patrol of Bear Peak, and an Indian Peaks overnighter.", followerCount: 128, followingCount: 86 },
  { id: "demo_diego", displayName: "Diego Park",    bio: "Sea kayaker and certified diver. Salt water in my veins.",            location: "San Diego, CA", interests: ["water", "outdoor"], photoURL: AV(12), skillLevels: { water: "Advanced", outdoor: "Intermediate" }, experience: { water: "10+ yrs" }, terrain: ["Ocean & coast", "Lakes & rivers"], intensity: "moderate", risk: "calculated", type2: "some", pace: "moderate", planning: "flexible", fitness: "fit", tripDuration: ["Day trips", "Overnighters"], availability: ["Weekends"], seasons: ["Summer", "Fall"], leadTime: "few-days", willTravel: "day", languages: ["English", "Spanish"], pets: "dog-friendly", lookingFor: ["Activity partners", "Casual meetups"], partnerWants: ["Good vibes / low ego", "Safety-first mindset"], certifications: ["Swiftwater rescue", "CPR"], gearShare: ["Kayak / SUP", "Cooler"], prompts: [{ q: "I feel most alive when\u2026", a: "the swell lines up and the sea caves are glassy." }], bucketList: ["Paddle the Sea of Cortez"], recentTrips: "La Jolla cave runs and a weekend on the coast.", followerCount: 64, followingCount: 51 },
  { id: "demo_sage",  displayName: "Sage Bennett",  bio: "Powder days only. Backcountry split-boarder.",                         location: "Salt Lake City, UT", interests: ["snow", "outdoor"], photoURL: AV(32), skillLevels: { snow: "Expert", outdoor: "Advanced" }, experience: { snow: "10+ yrs" }, terrain: ["Backcountry", "Snow & ice", "Alpine"], intensity: "expedition", risk: "calculated", type2: "love", pace: "hard", planning: "planner", fitness: "fit", tripDuration: ["Day trips", "Multi-day"], availability: ["Weekday mornings", "Weekends"], seasons: ["Winter", "Spring"], leadTime: "weeks", willTravel: "anywhere", languages: ["English"], pets: "no-pets", lookingFor: ["A regular crew", "Mentorship"], partnerWants: ["Safety-first mindset", "Similar skill level"], dealbreakers: ["Reckless with safety"], certifications: ["Avalanche L2", "Wilderness First Responder (WFR)"], gearShare: ["Skis / Splitboard", "GPS / InReach"], prompts: [{ q: "Best Type 2 fun I\u2019ve had\u2026", a: "A 12-hour Wasatch traverse that turned into 16." }, { q: "Green flag in an adventure partner\u2026", a: "checks the avy report before I even ask." }], bucketList: ["Ski-tour in Japan", "Denali"], recentTrips: "Dawn patrol laps and a hut trip in the Wasatch backcountry.", followerCount: 203, followingCount: 99 },
  { id: "demo_kai",   displayName: "Kai Thompson",  bio: "Gravel grinder & bikepacker. 10,000 ft of climbing is a good Tuesday.", location: "Bend, OR", interests: ["wheel", "outdoor"], photoURL: AV(15), skillLevels: { wheel: "Advanced" }, experience: { wheel: "5\u201310 yrs" }, terrain: ["Desert", "Forest & trail"], intensity: "strenuous", risk: "measured", type2: "some", pace: "hard", planning: "flexible", fitness: "training", trainingFor: "Steamboat Gravel", tripDuration: ["Day trips"], availability: ["Weekday evenings", "Weekends"], seasons: ["Spring", "Summer", "Fall"], leadTime: "few-days", willTravel: "roadtrip", languages: ["English"], pets: "dog", lookingFor: ["Activity partners"], partnerWants: ["Someone to push me", "Reliable & on time"], gearShare: ["Bike", "Roof rack / racks"], prompts: [{ q: "My ideal weekend\u2026", a: "120 gravel miles, tacos, and an early night." }], bucketList: ["Oregon Outback route"], recentTrips: "Cascade Lakes tempo rides and a gravel weekend near Bend.", followerCount: 88, followingCount: 73 },
  { id: "demo_nora",  displayName: "Nora Vance",    bio: "Wildlife photographer chasing golden hour and good light.",            location: "Jackson, WY", interests: ["nature", "outdoor"], photoURL: AV(45), skillLevels: { nature: "Advanced", outdoor: "Intermediate" }, experience: { nature: "5\u201310 yrs" }, terrain: ["Alpine", "Forest & trail"], intensity: "moderate", risk: "cautious", type2: "comfort", pace: "casual", planning: "planner", fitness: "weekend", tripDuration: ["Half-day", "Day trips"], availability: ["Weekday mornings"], seasons: ["Summer", "Fall"], leadTime: "weeks", willTravel: "day", languages: ["English", "French"], pets: "dog-friendly", lookingFor: ["Casual meetups", "Activity partners"], partnerWants: ["Good vibes / low ego"], gearShare: ["Camp stove"], prompts: [{ q: "I feel most alive when\u2026", a: "the light goes golden and a bull moose steps out." }], bucketList: ["Photograph the northern lights"], recentTrips: "Golden-hour mornings around Jackson and the Tetons.", followerCount: 156, followingCount: 64 },
  { id: "demo_eli",   displayName: "Eli Brooks",    bio: "Rock climber and camp-coffee enthusiast.",                            location: "Bishop, CA", interests: ["outdoor"], photoURL: AV(68), skillLevels: { climb: "Advanced", outdoor: "Intermediate" }, experience: { climb: "3\u20135 yrs" }, terrain: ["Crag / rock", "Desert"], intensity: "moderate", risk: "measured", type2: "some", pace: "moderate", planning: "spontaneous", fitness: "fit", tripDuration: ["Day trips"], availability: ["Weekends", "Flexible"], seasons: ["Spring", "Fall"], leadTime: "spontaneous", willTravel: "roadtrip", languages: ["English"], pets: "no-pets", lookingFor: ["Activity partners", "A regular crew"], partnerWants: ["Safety-first mindset", "Good vibes / low ego"], dealbreakers: ["Reckless with safety"], certifications: ["Lead belay certified"], gearShare: ["Climbing rack", "Ropes"], prompts: [{ q: "Most-used piece of gear\u2026", a: "My #2 cam and a thermos of camp coffee." }], bucketList: ["Send a multipitch in Red Rocks"], recentTrips: "Bouldering in the Buttermilks and sport laps at the local crag.", followerCount: 41, followingCount: 38 },
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
      interests: u.interests, photoURL: u.photoURL, photos: [u.photoURL],
      skillLevels: u.skillLevels || {}, experience: u.experience || {},
      terrain: u.terrain || [], intensity: u.intensity || "", risk: u.risk || "", type2: u.type2 || "",
      pace: u.pace || "", planning: u.planning || "", fitness: u.fitness || "", trainingFor: u.trainingFor || "",
      tripDuration: u.tripDuration || [], availability: u.availability || [], seasons: u.seasons || [],
      leadTime: u.leadTime || "", willTravel: u.willTravel || "", languages: u.languages || [], pets: u.pets || "",
      lookingFor: u.lookingFor || [], partnerWants: u.partnerWants || [], dealbreakers: u.dealbreakers || [],
      certifications: u.certifications || [], gearShare: u.gearShare || [], prompts: u.prompts || [],
      bucketList: u.bucketList || [], recentTrips: u.recentTrips || "",
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
