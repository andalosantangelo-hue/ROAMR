import { Capacitor } from "@capacitor/core";
import { doc, setDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase.js";

let listenersBound = false;
let activeUid = null;

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
