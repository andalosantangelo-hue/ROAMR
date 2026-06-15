// Deterministic 1:1 thread id from two uids (order-independent).
export function dmThreadId(a, b) {
  return [a, b].sort().join("__");
}
