// Feed scoping + ranking for the three feed modes shown in the top-bar dropdown:
//   For You  — personalized ranking (interests + who you follow + engagement + recency)
//   Near You — only content near your home base (city/region text match)
//   Following — only content from people you follow
// Pure helpers — no Firebase imports — so they're trivially unit-testable.

export const SCOPES = [
  { id: "foryou", label: "For You", blurb: "Picked for you" },
  { id: "nearby", label: "Near You", blurb: "Around your home base" },
  { id: "following", label: "Following", blurb: "People you follow" },
];

export const isScope = (s) => SCOPES.some((x) => x.id === s);

const lc = (v) => (typeof v === "string" ? v.toLowerCase() : "");

// First comma-delimited chunk, normalised. "Denver, CO" -> "denver".
export function cityToken(loc) {
  return lc(loc).split(",")[0].trim();
}

// Coerce a Firestore Timestamp / Date / number / ISO string to epoch ms.
export function toMillis(ts) {
  if (!ts) return 0;
  if (typeof ts === "number") return ts;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.toDate === "function") return ts.toDate().getTime();
  if (ts instanceof Date) return ts.getTime();
  const t = Date.parse(ts);
  return Number.isNaN(t) ? 0 : t;
}

// Flatten interests / sub-interests / activities (strings or {id,label,name,...})
// into a lowercase keyword set used to match against content text.
export function interestKeywords(profile) {
  const out = new Set();
  const push = (v) => {
    if (!v) return;
    if (typeof v === "string") { if (v.trim()) out.add(v.toLowerCase().trim()); return; }
    [v.label, v.name, v.id, v.activity, v.title].forEach(
      (x) => typeof x === "string" && x.trim() && out.add(x.toLowerCase().trim()));
  };
  [profile?.interests, profile?.subInterests, profile?.activities].forEach(
    (arr) => Array.isArray(arr) && arr.forEach(push));
  return out;
}

// Searchable text blob spanning the three content shapes (post / activity / tribe).
function itemText(it) {
  const parts = [it.text, it.title, it.name, it.caption, it.location, it.skillLevel];
  if (Array.isArray(it.categories)) parts.push(it.categories.join(" "));
  if (it.category) parts.push(it.category);
  if (Array.isArray(it.tags)) parts.push(it.tags.join(" "));
  return parts.filter(Boolean).join(" ").toLowerCase();
}

// Whoever authored / owns the item, across the different content shapes.
export function authorOf(it) {
  return it.authorId || it.ownerId || it.sellerId || it.uid || null;
}

export function engagementOf(it) {
  return (it.likeCount || 0) + (it.commentCount || 0)
    + (it.attendeeCount || 0) * 2 + (it.memberCount || 0);
}

// For-You score: interest match dominates, then followed authors, proximity,
// engagement and recency. Higher is better.
export function scoreForYou(it, ctx) {
  const text = itemText(it);
  let interest = 0;
  ctx.keywords.forEach((k) => { if (k && text.includes(k)) interest += 1; });
  const author = authorOf(it);
  const followed = ctx.followingIds?.has?.(author) ? 1 : 0;
  const own = author === ctx.uid ? 1 : 0;
  const eng = Math.log10(1 + engagementOf(it));
  const ageDays = (Date.now() - toMillis(it.createdAt)) / 86400000;
  const recency = Math.max(0, 1 - ageDays / 30); // linear decay over ~30 days
  const tok = cityToken(it.location);
  const near = ctx.home && tok && (tok === ctx.home || tok.includes(ctx.home) || ctx.home.includes(tok)) ? 1 : 0;
  return interest * 5 + followed * 4 + near * 2 + eng * 1.5 + recency * 2 + own * 0.5;
}

// Near You: keep items whose location token overlaps the user's home base.
// No home base set -> don't hide everything (degrade to "show all").
export function nearbyMatch(it, home) {
  if (!home) return true;
  const tok = cityToken(it.location);
  if (!tok) return false;
  return tok === home || tok.includes(home) || home.includes(tok);
}

// Following: items authored by someone you follow (or yourself).
export function followingMatch(it, ctx) {
  const author = authorOf(it);
  return !!author && (ctx.followingIds?.has?.(author) || author === ctx.uid);
}

// Apply a feed scope to a list. Always returns a NEW array.
export function applyScope(items, scope, ctx) {
  const list = Array.isArray(items) ? items.slice() : [];
  if (scope === "nearby") return list.filter((it) => nearbyMatch(it, ctx.home));
  if (scope === "following") return list.filter((it) => followingMatch(it, ctx));
  // foryou (default): stable sort by score desc
  return list
    .map((it, i) => [scoreForYou(it, ctx), i, it])
    .sort((a, b) => (b[0] - a[0]) || (a[1] - b[1]))
    .map((x) => x[2]);
}

// Build the shared context object the scopers need from the auth state.
export function feedCtx(profile, followingIds, uid) {
  return {
    keywords: interestKeywords(profile),
    home: cityToken(profile?.location),
    followingIds,
    uid: uid || null,
  };
}
