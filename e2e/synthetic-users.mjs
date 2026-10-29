// ROAMR synthetic beta run: N scripted users drive the real app against the Firebase
// emulators (project demo-roamr — never production). Each user signs up, completes
// onboarding and every profile section with a generated avatar, posts, creates
// activities/tribes/listings/trip plans, then follows, vouches, DMs, comments, joins,
// chats and reviews; two users tap every button on every screen; a few delete their
// accounts. Finally an audit compares stored data and counters with what users did.
//
// Usage (emulators + app running with VITE_USE_EMULATORS=1):
//   node e2e/make-avatars.mjs && node e2e/synthetic-users.mjs [N=100] [CONC=2] [--resume]
// Env: E2E_BASE (default http://127.0.0.1:5173). Results: e2e/.results/results.json
process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= "127.0.0.1:9099";
import { chromium } from "playwright";
import admin from "firebase-admin";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.E2E_BASE || "http://127.0.0.1:5173";
const N = +process.argv[2] || 100, CONC = +process.argv[3] || 8;
const DIR = import.meta.dirname, OUT = path.join(DIR, ".results"), AVATARS = path.join(DIR, ".avatars");
fs.mkdirSync(path.join(OUT, "shots"), { recursive: true });
admin.initializeApp({ projectId: "demo-roamr" });
const db = admin.firestore();

// ---------- personas ----------
const FIRST = ["Maya","Liam","Ava","Noah","Zara","Kai","Sofia","Mateo","Priya","Ethan","Lena","Omar","Hana","Jonas","Isla","Diego","Nia","Felix","Aria","Tomas","Leila","Owen","Yuki","Rafael","Elif","Caleb","Amara","Finn","Mei","Andre"];
const LAST = ["Rivers","Stone","Hart","Calder","Brooks","Vance","Okafor","Lindqvist","Moreno","Tanaka","Haddad","Ferris","Novak","Quinn","Ashby","Delgado","Kowal","Reyes","Sato","Abara"];
const CITIES = ["Denver, CO","Boulder, CO","Salt Lake City, UT","Bend, OR","Seattle, WA","Asheville, NC","Bozeman, MT","Moab, UT","Flagstaff, AZ","Lake Tahoe, CA","Anchorage, AK","Burlington, VT"];
const ACTS = { "Outdoor Adventures": ["Hiking","Backpacking","Climbing","Camping","Trail Running"], "Water Activities": ["Kayaking","Surfing","Paddleboarding"], "Wheel-based Activities": ["Mountain Biking","Gravel"], "Nature & Wildlife": ["Birding","Photography","Stargazing"], "Snow Adventures": ["Skiing","Snowboarding","Ski Touring"] };
// Edge-case display names (index → name) to stress validation/rendering.
const EDGE_NAMES = { 3: "José Ñúñez-Østergaard", 7: "🏔️ Peak Bagger 🧗", 11: "A".repeat(40), 15: "<script>alert(1)</script>", 19: "   Spacey   Name   ", 23: "李小龙", 27: "O'Brien \"Danger\" Smith", 31: "مريم الحسن" };
const EDGE_FILES = { 5: "huge_6000px.png", 9: "corrupt.jpg", 13: "not_an_image.png", 17: "photo.heic", 21: "tall_400x4000.jpg", 25: "tiny_1px.png" };
let r = 42; const rnd = () => ((r = (r * 16807) % 2147483647) / 2147483647); const pick = (a) => a[Math.floor(rnd() * a.length)];
const avatars = fs.readdirSync(AVATARS).filter((f) => f.startsWith("avatar_")).sort();
const RUN = Date.now().toString(36);
const users = Array.from({ length: N }, (_, i) => ({
  i, email: `tester${i}.${RUN}@roamr.test`, pw: `Pass!${i}word`,
  name: EDGE_NAMES[i] ?? `${pick(FIRST)} ${pick(LAST)}`,
  city: pick(CITIES), acts: [...new Set([pick(Object.keys(ACTS)), pick(Object.keys(ACTS))])],
  avatar: path.join(AVATARS, EDGE_FILES[i] ? `edge/${EDGE_FILES[i]}` : avatars[i % avatars.length]),
  steps: [], console: [], pageErrors: [], badRequests: [], uiErrors: [],
}));

// ---------- helpers ----------
const spaGo = (page, url) => page.evaluate((u) => { history.pushState({}, "", u); dispatchEvent(new PopStateEvent("popstate")); }, url);
async function newSession(browser, u) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, geolocation: { latitude: 39.74, longitude: -104.99 }, permissions: ["geolocation"] });
  await ctx.addInitScript(() => { try { localStorage.setItem("roamr_analytics_consent", "no"); } catch {} });
  const page = await ctx.newPage();
  page.on("console", (m) => { if (["error", "warning"].includes(m.type())) { const t = m.text(); if (!/Download the React DevTools|emulator|React Router Future/i.test(t)) u.console.push(`[${m.type()}] ${t.slice(0, 300)}`); } });
  page.on("pageerror", (e) => u.pageErrors.push(e.message.slice(0, 300)));
  page.on("response", (res) => { if (res.status() >= 400 && !/favicon/.test(res.url())) u.badRequests.push(`${res.status()} ${res.request().method()} ${res.url().slice(0, 160)}`); });
  page.setDefaultTimeout(15000);
  return { ctx, page };
}
async function step(u, page, name, fn) {
  const t = Date.now();
  try { await fn(); u.steps.push({ name, ok: true, ms: Date.now() - t }); return true; }
  catch (e) {
    const ui = await page.locator(".text-red-600, [role=alert]").allInnerTexts().catch(() => []);
    u.steps.push({ name, ok: false, ms: Date.now() - t, err: e.message.split("\n")[0].slice(0, 240), ui: ui.filter(Boolean).slice(0, 3), url: page.url() });
    await page.screenshot({ path: path.join(OUT, "shots", `u${u.i}_${name.replace(/\W+/g, "_")}.png`) }).catch(() => {});
    return false;
  }
}
const uiErr = async (u, page, where) => { const t = (await page.locator(".text-red-600").allInnerTexts().catch(() => [])).filter(Boolean); if (t.length) u.uiErrors.push(`${where}: ${t.join(" | ").slice(0, 200)}`); };
// LocationField's suggestion list stays open after typing and covers the fields below;
// tapping outside it (the page title) closes it, as a person would.
const closePlaces = (page, title) => page.getByRole("heading", { name: title }).click();
async function pool(items, n, fn) { let k = 0; await Promise.all(Array.from({ length: n }, async () => { while (k < items.length) { const it = items[k++]; await fn(it); } })); }
const future = (d) => { const x = new Date(Date.now() + d * 864e5); x.setMinutes(0); return x.toISOString().slice(0, 16); };

async function signIn(page, u) {
  // Sign-out reloads the app to /login by itself; don't race that navigation.
  if (!/\/login$/.test(new URL(page.url()).pathname)) await page.goto(`${BASE}/login`);
  await page.getByPlaceholder("Email").waitFor();
  await page.getByPlaceholder("Email").fill(u.email);
  await page.getByPlaceholder("Password").fill(u.pw);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await page.waitForURL(/\/app\/home|\/onboarding/);
  // WORKAROUND=1 restores the reload used against the old code (stale feed listeners).
  if (process.env.WORKAROUND) { await page.reload(); await page.waitForTimeout(1500); }
}
// The app must reject bad input with a readable message — never a raw Firebase error.
async function expectCleanError(page, re) {
  const alert = page.locator('[role="alert"], .text-red-600').filter({ hasText: re }).first();
  await alert.waitFor({ timeout: 15000 });
  const text = await alert.innerText();
  if (/firebase|permission_denied|storage\/|evaluation error|L\d+:\d+/i.test(text)) throw new Error(`raw error shown: ${text.slice(0, 120)}`);
  return text;
}

// Opens every Edit Profile section and fills it like a thorough user would.
async function fillWholeProfile(page, u) {
  // Activity chips are left alone: unticking every activity is (correctly) refused.
  await page.getByRole("button", { name: /Activities . experience/ }).first().click({ timeout: 4000 }).catch(() => {});
  for (const t of ["Your outdoor style", "Availability & travel", "Looking for", "Trust & gear", "Prompts", "Bucket list & recent trips"]) {
    const hdr = page.getByRole("button", { name: new RegExp(t.replace(/[&]/g, ".")) }).first();
    await hdr.click({ timeout: 4000 }).catch(() => {});
    await page.waitForTimeout(150);
    const sec = page.locator("div", { has: hdr }).last();
    const chips = sec.locator('button[type="button"]');
    const n = await chips.count().catch(() => 0);
    for (let k = u.i % 3; k < n; k += 3) await chips.nth(k).click({ timeout: 1500 }).catch(() => {});
  }
  await page.getByPlaceholder("e.g. Rainier in July").fill("Grand Teton in August", { timeout: 2500 }).catch(() => {});
  const addPrompt = page.getByRole("button", { name: /prompt/i }).last();
  if (await addPrompt.count()) { await addPrompt.click({ timeout: 2500 }).catch(() => {}); await page.locator("button.text-left").first().click({ timeout: 2500 }).catch(() => {}); }
  await page.getByPlaceholder("Your answer…").first().fill("Bivying on a ridge under the Milky Way.", { timeout: 2500 }).catch(() => {});
  await page.getByPlaceholder(/Thru-hike the JMT/).fill(["Thru-hike the JMT", "Climb the Grand Teton", "Ski-tour in Japan"].join("\n"), { timeout: 2500 }).catch(() => {});
  await page.getByPlaceholder("Where have you been lately?").fill("Zion, the Wind Rivers, and a chilly week in the Enchantments.", { timeout: 2500 }).catch(() => {});
}

// ---------- phase 1: sign up + full profile + content ----------
async function phase1(browser, u) {
  const { ctx, page } = await newSession(browser, u);
  try {
    if (!await step(u, page, "signup", async () => {
      await page.goto(`${BASE}/login`);
      await page.getByRole("button", { name: /Create Account/ }).first().click();
      await page.getByPlaceholder("Email").fill(u.email);
      await page.getByPlaceholder("Password").fill(u.pw);
      await page.locator('input[type="date"]').fill(`19${70 + (u.i % 30)}-0${1 + (u.i % 9)}-15`);
      await page.getByRole("button", { name: "Create Account", exact: true }).click();
      await page.waitForURL(/\/onboarding/);
      u.uid = (await admin.auth().getUserByEmail(u.email)).uid;
    })) return;
    await step(u, page, "onboarding", async () => {
      await page.locator("#displayName").fill(u.name);
      for (const a of u.acts) await page.getByRole("button", { name: a }).click();
      await page.getByRole("button", { name: "Continue" }).click();
      for (const a of u.acts) {
        const card = page.locator("div.rounded-2xl", { hasText: a }).first();
        await card.getByRole("button", { name: ACTS[a][u.i % ACTS[a].length], exact: true }).click();
        await card.getByRole("button", { name: ["Beginner", "Intermediate", "Advanced"][u.i % 3], exact: true }).click();
      }
      await page.getByPlaceholder("e.g. Denver, CO").fill(u.city);
      await page.getByRole("button", { name: ["Weekends", "Flexible", "Weekday evenings"][u.i % 3] }).click();
      await page.getByPlaceholder("e.g. A weekend in the Sawtooths").fill(`Climbing something big near ${u.city.split(",")[0]}`);
      await page.getByRole("button", { name: "Finish" }).click();
      await page.waitForURL(/\/app\/home/);
      if (process.env.WORKAROUND) { await page.reload(); await page.waitForTimeout(1500); }
    });
    // The bug every beta tester would have hit: a brand-new user must see real posts
    // without restarting the app. (Users 0-4 sign up before anyone has posted.)
    if (u.i >= 5) await step(u, page, "new_user_sees_feed", async () => {
      await page.locator("article").first().waitFor({ timeout: 10000 });
    });
    await step(u, page, "edit_profile_photo_bio", async () => {
      await spaGo(page, "/edit-profile");
      await page.getByRole("button", { name: /Save profile/ }).waitFor();
      await page.locator('input[type="file"]').first().setInputFiles(u.avatar);
      await page.waitForTimeout(EDGE_FILES[u.i] ? 4000 : 800);
      await uiErr(u, page, "photo-pick");
      await page.getByPlaceholder("A line about your adventures").fill(u.i === 33 ? "x".repeat(300) : `Weekend warrior from ${u.city}. Always down for sunrise missions ☀️`);
      await fillWholeProfile(page, u);
      await page.getByRole("button", { name: /Save profile/ }).click();
      // Undecodable / non-image / HEIC files must be refused with a clear message;
      // the user then swaps in a normal photo and saves successfully.
      if (/corrupt|not_an_image|heic/.test(path.basename(u.avatar))) {
        u.edgeMessage = await expectCleanError(page, /photo|image|HEIC|JPG/i);
        // The Photos section can be collapsed by now; open it so the photo's × is rendered.
        const remove = page.getByRole("button", { name: "Remove photo" }).first();
        if (!(await remove.count())) await page.getByRole("button", { name: /^Photos/ }).first().click();
        // 24px "×" target (below the 44px touch guideline) — tap it directly.
        await remove.dispatchEvent("click");
        await page.locator('input[type="file"]').first().setInputFiles(path.join(AVATARS, avatars[u.i % avatars.length]));
        await page.waitForTimeout(800);
        await page.getByRole("button", { name: /Save profile/ }).click();
      }
      await page.waitForURL((url) => !url.pathname.includes("edit-profile"), { timeout: 30000 });
    });
    await uiErr(u, page, "edit-profile");
    await step(u, page, "create_post", async () => {
      await spaGo(page, "/create-post");
      await page.locator('input[type="file"]').setInputFiles(path.join(AVATARS, avatars[(u.i * 7) % avatars.length]));
      await page.getByRole("button", { name: "Remove" }).first().waitFor({ timeout: 15000 }); // media thumbnail ready
      await page.locator("#post-title").fill(u.i === 35 ? "T".repeat(400) : `${pick(["Sunrise", "Bluebird", "Moody", "Epic"])} day at ${pick(["Longs Peak", "Angel's Landing", "Mt Si", "Half Dome", "Grays Peak"])}`);
      await page.locator("#post-loc").fill(u.city);
      await closePlaces(page, "New Post");
      await page.getByRole("button", { name: "4 stars" }).click();
      await page.getByRole("button", { name: "Post", exact: true }).click();
      await page.waitForURL(/\/app\/home/, { timeout: 30000 });
    });
    await uiErr(u, page, "create-post");
    await step(u, page, "create_activity", async () => {
      await spaGo(page, "/create-activity");
      await page.getByPlaceholder(/Sunrise hike/).fill(`${pick(["Sunrise hike", "Bouldering session", "Paddle + picnic", "Trail run"])} near ${u.city}. Who's in?`);
      await page.locator("#act-loc").fill(u.city);
      await closePlaces(page, "New Activity");
      await page.locator('input[type="datetime-local"]').fill(u.i === 37 ? "2020-01-01T08:00" : future(2 + (u.i % 20)));
      await page.getByRole("button", { name: ["All Levels", "Beginner", "Intermediate", "Advanced"][u.i % 4], exact: true }).click();
      await page.getByRole("button", { name: /Post Activity/ }).click();
      if (u.i === 37) { // past date must be refused, then fixed
        u.edgeMessage = await expectCleanError(page, /future/i);
        await page.locator('input[type="datetime-local"]').fill(future(3));
        await page.getByRole("button", { name: /Post Activity/ }).click();
      }
      await page.waitForURL((url) => !url.pathname.includes("create-activity"), { timeout: 30000 });
    });
    await uiErr(u, page, "create-activity");
    if (u.i % 4 === 0) await step(u, page, "create_tribe", async () => {
      await spaGo(page, "/create-tribe");
      await page.locator('input[type="file"]').setInputFiles(path.join(AVATARS, avatars[(u.i * 3) % avatars.length]));
      await page.getByPlaceholder("e.g. Weekend Wanderers").fill(`${u.city.split(",")[0]} ${pick(["Summit Seekers", "Dirtbags", "Paddle Crew", "Trail Tribe"])}`);
      await page.getByPlaceholder("e.g. Denver, CO").fill(u.city);
      await page.getByPlaceholder(/What's this tribe about/).fill("Weekly meetups, all levels welcome. Carpools from downtown.");
      await page.getByRole("button", { name: /Create Tribe/ }).last().click();
      await page.waitForURL((url) => !url.pathname.includes("create-tribe"), { timeout: 30000 });
    });
    if (u.i % 3 === 0) await step(u, page, "create_listing", async () => {
      await spaGo(page, "/create-listing");
      await page.getByPlaceholder(/2-person tent/).waitFor();
      await page.locator('input[type="file"]').setInputFiles([0, 1].map((k) => path.join(AVATARS, avatars[(u.i + k) % avatars.length])));
      await page.getByPlaceholder(/2-person tent/).fill(pick(["Black Diamond harness, size M", "MSR PocketRocket stove", "Osprey Atmos 65 pack", "Rental: 2 SUP boards"]));
      await page.getByPlaceholder("0").fill(u.i === 39 ? "1.2.3" : String(10 + u.i));
      await page.getByPlaceholder(/Condition, size/).fill("Lightly used, pickup downtown.");
      if (u.i === 39) { // "1.2.3" must not be accepted (it used to save as $0)
        if (await page.getByRole("button", { name: /List Gear/ }).last().isEnabled()) throw new Error("List Gear enabled with price 1.2.3");
        await page.getByPlaceholder("0").fill("45");
      }
      await page.getByRole("button", { name: /List Gear/ }).last().click();
      await page.waitForURL((url) => !url.pathname.includes("create-listing"), { timeout: 30000 });
    });
    if (u.i % 5 === 0) {
      await step(u, page, "emergency_info", async () => {
        await spaGo(page, "/safety/emergency");
        await page.getByPlaceholder("Contact name").fill("Jordan Test");
        await page.getByPlaceholder("Phone number").fill("+1 555 010 " + String(1000 + u.i).slice(-4));
        await page.getByPlaceholder(/Relationship/).fill("sibling");
        await page.getByPlaceholder(/bee stings/).fill("none");
        await page.locator("button", { hasText: /^Save/ }).last().click();
        await page.waitForTimeout(1500);
      });
      await uiErr(u, page, "emergency");
      await step(u, page, "trip_plan", async () => {
        await spaGo(page, "/safety/new-trip");
        await page.getByPlaceholder(/Summit Mt. Sneffels/).fill("Summit Longs Peak via Keyhole");
        await page.getByPlaceholder("e.g. Alpine climb").fill("Scramble");
        await page.getByPlaceholder(/Trailhead, route/).fill("Longs Peak TH, park at the ranger station");
        const dt = page.locator('input[type="datetime-local"]');
        await dt.nth(0).fill(future(1));
        await dt.nth(1).fill(u.i % 10 === 0 ? future(0.5) /* return before start */ : future(1.5));
        await page.getByRole("button", { name: /Save trip plan/ }).click();
        if (u.i % 10 === 0) { // return-before-start must be refused, then fixed
          u.edgeMessage = await expectCleanError(page, /return/i);
          await dt.nth(1).fill(future(1.5));
          await page.getByRole("button", { name: /Save trip plan/ }).click();
        }
        await page.waitForURL((url) => !url.pathname.includes("new-trip"), { timeout: 15000 });
      });
    }
    // Sign out and back in: does the profile survive?
    await step(u, page, "signout_signin", async () => {
      await spaGo(page, "/app/profile");
      await page.getByRole("button", { name: "Sign Out" }).click();
      await page.waitForURL(/\/login/);
      await page.waitForLoadState("load"); await page.waitForTimeout(1000); // the app reloads after wiping its cache
      await signIn(page, u);
    });
  } finally { await ctx.close(); }
}

// ---------- phase 2: social interactions ----------
async function phase2(browser, u, ids) {
  if (!u.uid) return;
  const { ctx, page } = await newSession(browser, u);
  try {
    if (!await step(u, page, "p2_signin", () => signIn(page, u))) return;
    await step(u, page, "like_posts_home", async () => {
      await page.locator("article").first().waitFor();
      const likes = page.locator("article div.flex.items-center.gap-5 > button:nth-child(1)");
      const n = Math.min(await likes.count(), 3);
      for (let k = 0; k < n; k++) await likes.nth(k).click();
      await page.waitForTimeout(500);
    });
    const others = ids.users.filter((x) => x !== u.uid);
    const target = others[(u.i * 13) % others.length];
    await step(u, page, "follow_user", async () => {
      await spaGo(page, `/u/${target}`);
      await page.getByRole("button", { name: "Follow", exact: true }).first().click();
      await page.getByRole("button", { name: "Following", exact: true }).first().waitFor({ timeout: 5000 });
    });
    if (u.i % 2 === 0) await step(u, page, "vouch_user", async () => {
      await page.getByRole("button", { name: /Vouch/ }).click();
      await page.getByPlaceholder(/Why do you vouch/).fill("Great partner on the rock, safe and solid belayer.");
      await page.getByRole("button", { name: "Post vouch" }).click();
      await page.getByRole("button", { name: "Vouched ✓" }).waitFor({ timeout: 6000 });
    });
    await step(u, page, "message_user", async () => {
      await spaGo(page, `/u/${target}`);
      await page.getByRole("button", { name: /^Message/ }).click();
      await page.waitForURL(/\/chat\//, { timeout: 8000 });
      await page.locator("textarea").fill(`Hey! Saw your post — want to link up this weekend? (from tester ${u.i})`);
      await page.getByRole("button", { name: "Send" }).click();
      await page.waitForTimeout(1500);
    });
    const post = ids.posts[(u.i * 7) % ids.posts.length];
    await step(u, page, "comment_post", async () => {
      await spaGo(page, `/comments/posts/${post}`);
      const txt = u.i === 41 ? "C".repeat(2500) : u.i === 43 ? "     " : `Stunning! Which trailhead? 🔥 #${u.i}`;
      await page.getByPlaceholder("Add a comment…").fill(txt);
      if (txt.trim()) { await page.locator('form button[type="submit"]').click(); await page.getByText(txt.slice(0, 30)).first().waitFor({ timeout: 8000 }); }
      else if (await page.locator('form button[type="submit"]').isEnabled()) throw new Error("submit enabled for whitespace-only comment");
    });
    await step(u, page, "join_activity", async () => {
      await spaGo(page, "/app/activities");
      const join = page.getByRole("button", { name: "Join", exact: true });
      await join.first().waitFor({ timeout: 8000 });
      await join.first().click();
      await page.waitForTimeout(800);
    });
    if (ids.tribes.length) await step(u, page, "join_tribe_and_chat", async () => {
      await spaGo(page, `/tribe/${ids.tribes[u.i % ids.tribes.length]}`);
      const join = page.getByRole("button", { name: "Join", exact: true }).first();
      const box = page.getByPlaceholder("Message the tribe…");
      // Wait for the page to settle into either state; checking immediately caught the
      // loading skeleton, skipped Join, and then waited for a composer that never came.
      await join.or(box).first().waitFor({ timeout: 15000 });
      if (await join.isVisible()) await join.click();
      await box.fill(`Hi tribe, tester ${u.i} here!`);
      await page.getByRole("button", { name: "Send" }).click();
      await page.getByText(`tester ${u.i} here`).first().waitFor({ timeout: 8000 });
    });
    if (u.i % 3 === 1) await step(u, page, "leave_review", async () => {
      await spaGo(page, `/review/${target}`);
      await page.getByRole("button", { name: "5 stars" }).first().waitFor();
      for (const b of await page.getByRole("button", { name: "5 stars" }).all()) await b.click();
      await page.getByPlaceholder("What should others know?").fill("Reliable, on time, great beta for the route.");
      await page.getByRole("button", { name: /Submit review/ }).click();
      await page.waitForURL((url) => !url.pathname.includes("/review/"), { timeout: 8000 });
    });
    await uiErr(u, page, "phase2");
  } finally { await ctx.close(); }
}

// ---------- phase 3: crawl every screen, click every safe button ----------
const ROUTES = ["/app/home", "/app/activities", "/app/tribes", "/app/marketplace", "/app/premium", "/app/profile", "/settings", "/about", "/help", "/help/bot", "/guides", "/messages", "/notifications", "/safety", "/safety/verify", "/safety/emergency", "/safety/controls", "/safety/waiver", "/safety/trips", "/edit-profile", "/legal/terms", "/legal/privacy"];
const SKIP = /sign out|delete|block|report|log ?out|unfollow|remove|cancel trip|leave/i;
async function phase3(browser, u) {
  const { ctx, page } = await newSession(browser, u);
  const dead = [];
  try {
    await signIn(page, u);
    for (const route of ROUTES) {
      await step(u, page, `crawl ${route}`, async () => {
        await spaGo(page, route); await page.waitForTimeout(900);
        const n = await page.locator("button:visible, a:visible").count();
        for (let k = 0; k < Math.min(n, 25); k++) {
          await spaGo(page, route); await page.waitForTimeout(250);
          const el = page.locator("button:visible, a:visible").nth(k);
          const label = ((await el.innerText().catch(() => "")) || (await el.getAttribute("aria-label").catch(() => "")) || "").trim().slice(0, 40);
          if (!label || SKIP.test(label)) continue;
          if (await el.isDisabled().catch(() => true)) continue;
          const href = await el.getAttribute("href").catch(() => null);
          if (href && /^(mailto|tel|https?):/.test(href)) continue;
          const before = page.url() + (await page.locator("body").innerHTML()).length;
          await el.click({ timeout: 3000 }).catch(() => {});
          await page.waitForTimeout(500);
          const after = page.url() + (await page.locator("body").innerHTML()).length;
          if (before === after) dead.push(`${route} → "${label}"`);
          if (page.url().endsWith("/") || /\/login$/.test(page.url())) dead.push(`${route} → "${label}" bounced to ${new URL(page.url()).pathname}`);
        }
      });
    }
  } finally { u.deadButtons = dead; await ctx.close(); }
}

// ---------- phase 4: delete account for users whose content got interactions ----------
async function phase4(browser, u) {
  const { ctx, page } = await newSession(browser, u);
  try {
    await signIn(page, u);
    await step(u, page, "delete_account", async () => {
      await spaGo(page, "/settings");
      await page.getByText("Delete account", { exact: false }).first().click();
      const inp = page.locator("input:visible").last(); if (await inp.count()) await inp.fill("DELETE").catch(() => {});
      await page.getByRole("button", { name: /Delete forever/ }).click();
      await page.waitForURL(/\/login|\/$/, { timeout: 20000 });
    });
    await uiErr(u, page, "delete");
  } finally { await ctx.close(); }
}

// ---------- audit: compare stored data vs what users did ----------
async function audit() {
  const A = { profile: [], counters: [], deletion: [], misc: [] };
  const fol = {}; for (const d of (await db.collectionGroup("following").get()).docs) fol[d.id] = (fol[d.id] || 0) + 1;
  for (const u of users.filter((x) => x.uid && !x.deleted)) {
    const d = (await db.doc(`users/${u.uid}`).get()).data() || {};
    const want = u.name.trim();
    if ((d.displayName || "") !== want && (d.displayName || "").trim() !== want.replace(/\s+/g, " ")) A.profile.push(`u${u.i}: name "${want}" stored as "${d.displayName}"`);
    if (!d.photoURL && u.steps.find((s) => s.name === "edit_profile_photo_bio" && s.ok)) A.profile.push(`u${u.i}: profile saved OK but photoURL empty (file ${path.basename(u.avatar)})`);
    if (!d.bio && u.steps.find((s) => s.name === "edit_profile_photo_bio" && s.ok)) A.profile.push(`u${u.i}: bio missing after save`);
    if (!(d.interests || []).length) A.profile.push(`u${u.i}: interests empty after onboarding`);
    const followers = fol[u.uid] || 0;
    if (followers >= 0 && (d.followerCount ?? 0) !== followers) A.counters.push(`user u${u.i}: followerCount ${d.followerCount ?? 0} vs actual ${followers}`);
  }
  for (const col of ["posts", "activities"]) {
    for (const p of (await db.collection(col).get()).docs) {
      const x = p.data();
      const likes = (await p.ref.collection("likes").get()).size, comments = (await p.ref.collection("comments").get()).size;
      if ((x.likeCount ?? 0) !== likes) A.counters.push(`${col}/${p.id}: likeCount ${x.likeCount ?? 0} vs ${likes} likes`);
      if ((x.commentCount ?? 0) !== comments) A.counters.push(`${col}/${p.id}: commentCount ${x.commentCount ?? 0} vs ${comments} comments`);
      if (col === "activities") { const att = (await p.ref.collection("attendees").get()).size; if ((x.attendeeCount ?? 0) !== att) A.counters.push(`activities/${p.id}: attendeeCount ${x.attendeeCount ?? 0} vs ${att}`); if (x.when && new Date(x.when?.toDate?.() ?? x.when) < new Date()) A.misc.push(`activities/${p.id}: scheduled in the past (${x.when?.toDate?.() ?? x.when}) and accepted`); }
    }
  }
  for (const t of (await db.collection("tribes").get()).docs) { const m = (await t.ref.collection("members").get()).size; if ((t.data().memberCount ?? 0) !== m) A.counters.push(`tribes/${t.id}: memberCount ${t.data().memberCount ?? 0} vs ${m}`); }
  for (const u of users.filter((x) => x.deleted)) {
    const left = [];
    if ((await db.doc(`users/${u.uid}`).get()).exists) left.push("users doc");
    for (const c of ["posts", "activities", "listings", "tribes"]) { const n = (await db.collection(c).where(c === "tribes" ? "ownerId" : "authorId", "==", u.uid).get().catch(() => ({ size: 0 }))).size; if (n) left.push(`${n} ${c}`); }
    const auth = await admin.auth().getUser(u.uid).then(() => true).catch(() => false);
    if (auth) left.push("Auth account still exists");
    A.deletion.push(`u${u.i}: ${left.length ? "LEFT BEHIND → " + left.join(", ") : "fully removed"}`);
  }
  return A;
}

// ---------- main ----------
const t0 = Date.now();
// Resilient browser: relaunch on crash and recycle every 20 sessions to cap memory.
let browser = null, sessions = 0, recycling = null;
async function getBrowser() {
  if (recycling) await recycling;
  if (!browser || !browser.isConnected() || sessions >= 5) {
    recycling = (async () => {
      const old = browser; browser = await chromium.launch({ channel: process.env.E2E_CHANNEL || undefined }); sessions = 0;
      if (old) setTimeout(() => old.close().catch(() => {}), 120000); // let in-flight sessions finish
    })();
    await recycling; recycling = null;
  }
  sessions++; return browser;
}
const safe = (phase) => async (u, ...rest) => {
  try { await phase(await getBrowser(), u, ...rest); }
  catch (e) { u.steps.push({ name: `harness_crash_${phase.name}`, ok: false, err: e.message.split("\n")[0].slice(0, 200) }); }
};
const [p1, p2, p3, p4] = [safe(phase1), safe(phase2), safe(phase3), safe(phase4)];
let done = 0;
// --resume: reuse phase-1 accounts/results saved in out/partial.json (the emulator
// still holds their data) and continue from phase 2.
if (process.argv.includes("--resume")) {
  const saved = JSON.parse(fs.readFileSync(path.join(OUT, "partial.json"), "utf8"));
  users.length = 0; users.push(...saved);
  for (const u of users) { u.steps = u.steps.filter((s) => !s.name.startsWith("p2_") && !s.name.startsWith("crawl")); }
  console.log(`resumed ${users.length} users from phase 1 (${users.filter((u) => u.uid).length} with accounts)`);
} else {
  console.log(`phase1: ${N} users, concurrency ${CONC}`);
  await pool(users, CONC, async (u) => { await p1(u); if (++done % 10 === 0) console.log(`  ${done}/${N}`); });
  fs.writeFileSync(path.join(OUT, "partial.json"), JSON.stringify(users, null, 1));
  // Snapshot the emulator data so a later crash only costs one phase
  // (restart the emulators with --import <dir> and run with --resume).
  const snap = path.join(DIR, ".snapshots", "after-phase1");
  fs.mkdirSync(path.dirname(snap), { recursive: true });
  await fetch("http://127.0.0.1:4400/_admin/export", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ path: snap, initiatedBy: "export" }) })
    .then((r) => console.log(`snapshot after phase 1: ${r.ok ? snap : "failed " + r.status}`)).catch((e) => console.log("snapshot failed:", e.message));
}
const ids = {
  users: users.filter((u) => u.uid).map((u) => u.uid),
  posts: (await db.collection("posts").get()).docs.map((d) => d.id),
  tribes: (await db.collection("tribes").get()).docs.map((d) => d.id),
};
console.log(`phase2: interactions (${ids.posts.length} posts, ${ids.tribes.length} tribes)`); done = 0;
await pool(users, CONC, async (u) => { await p2(u, ids); if (++done % 10 === 0) console.log(`  ${done}/${N}`); });
fs.writeFileSync(path.join(OUT, "partial.json"), JSON.stringify(users, null, 1));
console.log("phase3: crawl");
await pool(users.filter((u) => u.uid && !EDGE_NAMES[u.i]).slice(0, 2), 2, (u) => p3(u));
fs.writeFileSync(path.join(OUT, "partial.json"), JSON.stringify(users, null, 1));
console.log("waiting for functions to settle"); await new Promise((r) => setTimeout(r, 10000));
console.log("phase4: deletes");
const delUsers = users.filter((u) => u.uid && u.i % 25 === 2).slice(0, 4);
await pool(delUsers, 2, async (u) => { await p4(u); u.deleted = true; });
await new Promise((r) => setTimeout(r, 5000));
await browser?.close().catch(() => {});
console.log("audit");
fs.writeFileSync(path.join(OUT, "partial.json"), JSON.stringify(users, null, 1));
let A; try { A = await audit(); } catch (e) { A = { error: e.message }; }
const result = { N, minutes: ((Date.now() - t0) / 6e4).toFixed(1), users, audit: A };
fs.writeFileSync(path.join(OUT, "results.json"), JSON.stringify(result, null, 1));
const stepStats = {};
for (const u of users) for (const s of u.steps) { const k = s.name.startsWith("crawl") ? "crawl" : s.name; stepStats[k] ??= { ok: 0, fail: 0, errs: {} }; s.ok ? stepStats[k].ok++ : (stepStats[k].fail++, stepStats[k].errs[(s.ui?.[0] || s.err).slice(0, 120)] = (stepStats[k].errs[(s.ui?.[0] || s.err).slice(0, 120)] || 0) + 1); }
console.log(JSON.stringify(stepStats, null, 1));
console.log("AUDIT", JSON.stringify(A, null, 1).slice(0, 6000));
console.log(`done in ${result.minutes} min`);

// Gate for CI: fail the run if users hit errors. Crawl "dead button" findings are
// reported but don't fail the build (some buttons are legitimately no-ops when
// there's nothing to show).
const problems = [];
for (const [k, v] of Object.entries(stepStats)) {
  if (k === "crawl") continue;
  const rate = v.fail / Math.max(1, v.ok + v.fail);
  if (rate > 0.05) problems.push(`${k}: ${v.fail}/${v.ok + v.fail} failed`);
}
const crashes = users.flatMap((u) => u.pageErrors || []);
if (crashes.length) problems.push(`${crashes.length} page crash(es): ${crashes[0].slice(0, 120)}`);
for (const k of ["profile", "counters"]) if (A?.[k]?.length) problems.push(`audit ${k}: ${A[k].length} mismatch(es), e.g. ${A[k][0]}`);
if ((A?.deletion || []).some((x) => /LEFT BEHIND/.test(x))) problems.push(`account deletion left data: ${A.deletion.find((x) => /LEFT BEHIND/.test(x))}`);
if (A?.error) problems.push(`audit error: ${A.error}`);
if (problems.length) { console.log("\nFAILED:\n - " + problems.join("\n - ")); process.exit(1); }
console.log("\nPASSED");
process.exit(0);

