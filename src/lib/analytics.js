import { isSupported, getAnalytics, logEvent } from "firebase/analytics";
import { app } from "./firebase.js";

// Guarded: only fires where Analytics is supported (web/PWA). No-op otherwise.
const analyticsP = isSupported().then((ok) => (ok ? getAnalytics(app) : null)).catch(() => null);

export async function track(event, params = {}) {
  try { const a = await analyticsP; if (a) logEvent(a, event, params); } catch {}
}
