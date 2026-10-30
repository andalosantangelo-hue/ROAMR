// Small shared helpers (unit-tested in util.test.js).

// Immutably flip an id's membership in a Set — used by all optimistic toggles.
export function toggleSet(set, id) {
  const next = new Set(set);
  if (next.has(id)) next.delete(id); else next.add(id);
  return next;
}

// Two-letter initials for avatar fallbacks.
export function initials(name = "") {
  return name.trim().split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

// Capitalize the first letter of every word, leaving the rest as typed
// ("john smith" -> "John Smith", "McDonald" -> "McDonald"). Used to normalize names.
export function titleCase(s = "") {
  return s.replace(/\s+/g, " ").trim().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

// Built-in demo items (src/data/*, DEV only) use numeric ids; Firestore ids are strings.
// Writes are skipped for demo items only.
export function isDemoId(id) {
  return typeof id !== "string";
}

// Coerce any stored value to text safe to render as a React child. Firestore data is
// user-written, and an object where a string was expected used to throw during render
// and take down the whole screen.
export function safeText(v, max = 5000) {
  if (v == null) return "";
  if (typeof v === "string") return v.slice(0, max);
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "";
}

// Where to send a user after sign-in/onboarding: the in-app page they were trying to
// open (e.g. a shared tribe link). Only same-app paths are accepted, so a crafted
// link can't bounce people to another site ("//evil.com", "/\evil.com", "https://…").
export function safeReturnPath(from) {
  if (typeof from !== "string" || !from.startsWith("/") || from.startsWith("//") || from.includes("\\")) return null;
  if (from === "/" || from.startsWith("/login") || from.startsWith("/onboarding")) return null;
  return from.slice(0, 300);
}

// Post media must come from our own Storage bucket. Rules only check the media list's
// shape (a per-URL check for 10 items exceeds the rules expression budget), so the
// renderer refuses anything else — an off-site URL could be a tracking pixel that logs
// every viewer's IP. 127.0.0.1:9199 is the local Storage emulator.
export function isSafeMediaUrl(v) {
  if (typeof v !== "string" || v.length > 2000) return false;
  try {
    const u = new URL(v);
    return (u.protocol === "https:" && u.host === "firebasestorage.googleapis.com")
      || (u.protocol === "http:" && u.host === "127.0.0.1:9199");
  } catch { return false; }
}
