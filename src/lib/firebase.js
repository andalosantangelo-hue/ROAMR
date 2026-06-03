import { initializeApp } from "firebase/app";
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
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

// Offline-first: cached feeds/tribes render and writes queue while offline,
// syncing on reconnect (§9.C.2). Native (Capacitor) persists by default too.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

export const storage = getStorage(app);
export const auth = getAuth(app);

isSupported().then((ok) => { if (ok) getAnalytics(app); }).catch(() => {});
