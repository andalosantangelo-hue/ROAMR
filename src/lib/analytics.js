import { isSupported, getAnalytics, logEvent } from "firebase/analytics";
import { app } from "./firebase.js";

// Guarded: only fires where Analytics is supported (web/PWA). No-op otherwise.
const consent = typeof localStorage !== "undefined" && localStorage.getItem("roamr_analytics_consent") === "yes";
const analyticsP = consent
  ? isSupported().then((ok) => (ok ? getAnalytics(app) : null)).catch(() => null)
  : Promise.resolve(null);

export async function track(event, params = {}) {
  try { const a = await analyticsP; if (a) logEvent(a, event, params); } catch {}
}
