import { initializeApp } from "firebase/app";
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager, connectFirestoreEmulator,
} from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

// Firebase web config is safe to ship in client code.
const firebaseConfig = {
  apiKey: "AIzaSyB25GLlLAoUiyn8u8NcdrHnLR7GSZJIqDo",
  authDomain: "roamr-55afb.firebaseapp.com",
  projectId: "roamr-55afb",
  storageBucket: "roamr-55afb.firebasestorage.app",
  messagingSenderId: "88903312867",
  appId: "1:88903312867:web:e434a1b34333457f8aacd6",
  measurementId: "G-KV4CJPW5D9",
};

export const app = initializeApp(firebaseConfig);

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

// Local dev against the Firebase emulators: `VITE_USE_EMULATORS=1 npm run dev`
// with `npx firebase emulators:start --only auth,firestore,storage` running.
// Never active in production builds.
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectStorageEmulator(storage, "127.0.0.1", 9199);
}

const analyticsConsent = typeof localStorage !== "undefined" && localStorage.getItem("roamr_analytics_consent") === "yes";
isSupported().then((ok) => { if (ok && analyticsConsent) getAnalytics(app); }).catch(() => {});
