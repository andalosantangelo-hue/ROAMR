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
