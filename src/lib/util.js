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

// Whole years between a YYYY-MM-DD birth date and `today`; NaN for bad input.
// Used for the 18+ gate — the birth date itself is never stored.
export function ageOn(dob, today = new Date()) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob || "");
  if (!m) return NaN;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < mo || (today.getMonth() + 1 === mo && today.getDate() < d)) age--;
  return age;
}
