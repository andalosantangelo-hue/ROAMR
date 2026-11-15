import { Capacitor } from "@capacitor/core";
import { doc, setDoc, arrayUnion, arrayRemove, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase.js";

let listenersBound = false;
let activeUid = null;
let deviceToken = null;

// Registers this device for push and stores its FCM token on the user doc.
// Native only (iOS/Android via Capacitor). Throws a friendly error on web.
export async function registerPush(uid) {
  activeUid = uid;
  if (!Capacitor.isNativePlatform()) {
    throw new Error("Push notifications work in the ROAMR mobile app.");
  }
  const { PushNotifications } = await import("@capacitor/push-notifications");

  let perm = await PushNotifications.checkPermissions();
  if (perm.receive === "prompt") perm = await PushNotifications.requestPermissions();
  if (perm.receive !== "granted") throw new Error("Notifications permission was declined.");

  if (!listenersBound) {
    listenersBound = true;
    PushNotifications.addListener("registration", async (token) => {
      deviceToken = token.value;
      if (!activeUid) return;
      try {
        await setDoc(doc(db, "users", activeUid, "private", "data"),
          { fcmTokens: arrayUnion(token.value), updatedAt: serverTimestamp() }, { merge: true });
      } catch (e) { console.warn("token save:", e.message); }
    });
    PushNotifications.addListener("registrationError", (err) => console.warn("push reg error:", err));
  }
  await PushNotifications.register();
}

// Detaches this device from the signed-out account so the next person to sign in on
// a shared phone doesn't receive the previous user's DM previews.
export async function unregisterPush(uid) {
  const token = deviceToken;
  activeUid = null;
  if (!uid || !token) return;
  try {
    await setDoc(doc(db, "users", uid, "private", "data"),
      { fcmTokens: arrayRemove(token), updatedAt: serverTimestamp() }, { merge: true });
  } catch (e) { console.warn("token remove:", e.message); }
}
