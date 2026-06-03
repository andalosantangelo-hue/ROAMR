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
