import { Capacitor } from "@capacitor/core";

// Native-only; no-op on web. Light tap for toggles, success for completed creates.
export async function tapLight() {
  if (!Capacitor.isNativePlatform()) return;
  try { const { Haptics, ImpactStyle } = await import("@capacitor/haptics"); await Haptics.impact({ style: ImpactStyle.Light }); } catch {}
}
export async function tapSuccess() {
  if (!Capacitor.isNativePlatform()) return;
  try { const { Haptics, NotificationType } = await import("@capacitor/haptics"); await Haptics.notification({ type: NotificationType.Success }); } catch {}
}
