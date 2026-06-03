import { track } from "./analytics.js";

export function inviteUrl(type, id) {
  const origin = (typeof window !== "undefined" && window.location && window.location.origin) || "https://roamr-55afb.web.app";
  return `${origin}/invite/${type}/${id}`;
}

// Native share sheet (Web Share API — works in mobile web + Capacitor webview),
// falling back to clipboard copy. Returns "shared" | "copied" | "cancelled" | "failed".
export async function shareInvite({ title, text, type, id }) {
  const url = inviteUrl(type, id);
  track("invite_share", { type });
  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({ title, text, url });
      return "shared";
    }
  } catch (e) {
    if (e && e.name === "AbortError") return "cancelled";
  }
  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "failed";
  }
}
