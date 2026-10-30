import { initializeApp } from "firebase/app";
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager, connectFirestoreEmulator,
} from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getAnalytics, isSupported } from "firebase/analytics";

// Local development / CI: VITE_USE_EMULATORS=1 points the app at the Firebase
// emulators under a "demo-" project, which can never reach production data.
const useEmulators = import.meta.env.VITE_USE_EMULATORS === "1";

// Firebase web config is safe to ship in client code.
const firebaseConfig = useEmulators ? {
  apiKey: "demo-key",
  authDomain: "demo-roamr.firebaseapp.com",
  projectId: "demo-roamr",
  storageBucket: "demo-roamr.appspot.com",
  appId: "demo-app",
} : {
  apiKey: "AIzaSyB25GLlLAoUiyn8u8NcdrHnLR7GSZJIqDo",
  authDomain: "roamr-55afb.firebaseapp.com",
  projectId: "roamr-55afb",
  storageBucket: "roamr-55afb.firebasestorage.app",
  messagingSenderId: "88903312867",
  appId: "1:88903312867:web:e434a1b34333457f8aacd6",
  measurementId: "G-KV4CJPW5D9",
};

export const app = initializeApp(firebaseConfig);

// After sign-out / account deletion we set this flag and reload; the offline cache
// (DMs, trip plans, medical info) is deleted here, BEFORE Firestore opens it. Deleting
// it from the running app hung, because the open database blocks the delete.
export const WIPE_CACHE_FLAG = "roamr_wipe_cache";
try {
  if (localStorage.getItem(WIPE_CACHE_FLAG) === "1") {
    localStorage.removeItem(WIPE_CACHE_FLAG);
    indexedDB.deleteDatabase(`firestore/[DEFAULT]/${firebaseConfig.projectId}/main`);
  }
} catch { /* storage unavailable (private mode) — nothing cached to wipe */ }

// App Check (bot/abuse + rate-limit protection). Set VITE_RECAPTCHA_SITE_KEY to enable.
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
if (import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (e) { console.warn("App Check init:", e.message); }
}

// Offline-first: cached feeds/tribes render and writes queue while offline,
// syncing on reconnect (§9.C.2). Native (Capacitor) persists by default too.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

export const storage = getStorage(app);
export const auth = getAuth(app);
export const functions = getFunctions(app);

if (useEmulators) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectStorageEmulator(storage, "127.0.0.1", 9199);
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
}

const analyticsConsent = typeof localStorage !== "undefined" && localStorage.getItem("roamr_analytics_consent") === "yes";
isSupported().then((ok) => { if (ok && analyticsConsent) getAnalytics(app); }).catch(() => {});
