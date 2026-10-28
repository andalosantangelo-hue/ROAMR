import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signInWithPopup, signInWithCredential, GoogleAuthProvider, OAuthProvider, signOut, sendPasswordResetEmail,
  fetchSignInMethodsForEmail, sendEmailVerification,
} from "firebase/auth";
import { Capacitor } from "@capacitor/core";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import {
  doc, getDoc, setDoc, deleteDoc, addDoc, collection, getDocs, query, where,
  onSnapshot, orderBy, limit, serverTimestamp, deleteField, terminate, clearIndexedDbPersistence,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { auth, db, functions } from "../lib/firebase.js";
import { unregisterPush } from "../lib/push.js";
import { toggleSet } from "../lib/util.js";

const AuthContext = createContext(null);

// Private fields (email/phone/tokens/prefs/gender) live in users/{uid}/private/data —
// readable ONLY by the owner. The users/{uid} doc holds public profile fields.
const privDoc = (uid) => doc(db, "users", uid, "private", "data");

// A profile "needs onboarding" until it has a name and at least one interest, so a
// user who quit or errored mid-onboarding is sent back there instead of to Home.
export const needsOnboarding = (data) => !data?.displayName || !(data?.interests || []).length;

async function ensureUserDoc(user) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const privBase = {
    email: user.email || null,
    phoneNumber: user.phoneNumber || null,
    updatedAt: serverTimestamp(),
  };
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid, displayName: user.displayName || null, photoURL: user.photoURL || null,
      interests: [], bio: "",
      subscription: { tier: "basic", source: "manual", renewsAt: null, amount: null },
      followingCount: 0, followerCount: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
    await setDoc(privDoc(user.uid), { ...privBase, fcmTokens: [], notificationPrefs: {}, createdAt: serverTimestamp() });
    return { isNew: true, interests: [] };
  }
  // Returning user: only fill name/photo from the auth provider when the profile has
  // none. Writing them unconditionally (as before) replaced the name and photo the
  // user chose in ROAMR with null on every email sign-in.
  const data = snap.data();
  const fill = {};
  if (!data.displayName && user.displayName) fill.displayName = user.displayName;
  if (!data.photoURL && user.photoURL) fill.photoURL = user.photoURL;
  if (Object.keys(fill).length) await setDoc(ref, { ...fill, updatedAt: serverTimestamp() }, { merge: true });
  await setDoc(privDoc(user.uid), privBase, { merge: true });
  return { isNew: needsOnboarding({ ...data, ...fill }), interests: data.interests || [] };
}

// Wipes this device's offline Firestore cache (DMs, trip plans, medical info) and
// reloads, so nothing from the previous account survives a sign-out on a shared phone.
async function clearLocalData() {
  try { await terminate(db); await clearIndexedDbPersistence(db); } catch (e) { console.warn("cache clear:", e.message); }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [blockedIds, setBlockedIds] = useState(new Set());
  const [followingIds, setFollowingIds] = useState(new Set());
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  // "loading" until the first profile snapshot, "ready" after, "error" if it failed.
  // Edit Profile only renders its form when "ready", so a failed load can't save an
  // empty form over the user's real profile.
  const [profileStatus, setProfileStatus] = useState("loading");

  useEffect(() => onAuthStateChanged(auth, (u) => {
    setUser(u);
    if (!u) { setProfile(null); setProfileStatus("loading"); }
    setLoading(false);
  }), []);

  // Live profile: picks up server-side changes (verification approved, new ratings,
  // follower counts) without a reload, and the doc created during sign-up.
  useEffect(() => {
    if (!user) return;
    let priv = {}, pub = null;
    const merge = () => setProfile({ ...(pub || {}), ...priv });
    getDoc(privDoc(user.uid)).then((s) => { priv = s.exists() ? s.data() : {}; if (pub) merge(); }).catch(() => {});
    return onSnapshot(doc(db, "users", user.uid),
      (s) => { pub = s.exists() ? s.data() : {}; merge(); setProfileStatus("ready"); },
      (e) => { console.warn("profile:", e.message); setProfileStatus("error"); });
  }, [user]);

  useEffect(() => {
    if (!user) { setBlockedIds(new Set()); return; }
    return onSnapshot(
      collection(db, "users", user.uid, "blocked"),
      (snap) => setBlockedIds(new Set(snap.docs.map((d) => d.id))),
      (e) => console.warn("blocked:", e.message)
    );
  }, [user]);

  useEffect(() => {
    if (!user) { setFollowingIds(new Set()); return; }
    return onSnapshot(
      collection(db, "users", user.uid, "following"),
      (snap) => setFollowingIds(new Set(snap.docs.map((d) => d.id))),
      (e) => console.warn("following:", e.message)
    );
  }, [user]);

  useEffect(() => {
    if (!user) { setNotifications([]); return; }
    return onSnapshot(
      query(collection(db, "users", user.uid, "notifications"), orderBy("createdAt", "desc"), limit(30)),
      (snap) => setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (e) => console.warn("notifications:", e.message)
    );
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const markNotifsRead = async () => {
    if (!user) return;
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(unread.map((n) =>
      setDoc(doc(db, "users", user.uid, "notifications", n.id), { read: true }, { merge: true })));
  };

  const toggleFollow = async (targetUid) => {
    if (!user || !targetUid || targetUid === user.uid) return;
    const was = followingIds.has(targetUid);
    setFollowingIds((p) => toggleSet(p, targetUid));
    try {
      const ref = doc(db, "users", user.uid, "following", targetUid);
      if (was) await deleteDoc(ref);
      else await setDoc(ref, { targetUid, createdAt: serverTimestamp() });
    } catch (e) {
      setFollowingIds((p) => toggleSet(p, targetUid));
      console.warn("follow:", e.message);
    }
  };

  const afterAuth = async (cred) => ensureUserDoc(cred.user);
  const emailMethods = (email) => fetchSignInMethodsForEmail(auth, email);
  const signInEmail = async (e, pw) => afterAuth(await signInWithEmailAndPassword(auth, e, pw));
  const signUpEmail = async (e, pw) => {
    const cred = await createUserWithEmailAndPassword(auth, e, pw);
    try { await sendEmailVerification(cred.user); } catch {}
    return afterAuth(cred);
  };
  const resendVerification = () => auth.currentUser ? sendEmailVerification(auth.currentUser) : Promise.resolve();
  const isNative = Capacitor.isNativePlatform();

  const googleSignIn = async () => {
    if (isNative) {
      // Native (Capacitor): plugin shows the native Google picker; we bridge the
      // returned OAuth credential into the JS SDK so it owns the session
      // (capacitor.config → FirebaseAuthentication.skipNativeAuth = true).
      const res = await FirebaseAuthentication.signInWithGoogle();
      const cred = GoogleAuthProvider.credential(res.credential?.idToken, res.credential?.accessToken);
      return afterAuth(await signInWithCredential(auth, cred));
    }
    return afterAuth(await signInWithPopup(auth, new GoogleAuthProvider()));
  };
  const appleSignIn = async () => {
    if (isNative) {
      const res = await FirebaseAuthentication.signInWithApple();
      const provider = new OAuthProvider("apple.com");
      const cred = provider.credential({ idToken: res.credential?.idToken, rawNonce: res.credential?.nonce });
      return afterAuth(await signInWithCredential(auth, cred));
    }
    const p = new OAuthProvider("apple.com"); p.addScope("email"); p.addScope("name");
    return afterAuth(await signInWithPopup(auth, p));
  };
  const resetPassword = (email) => sendPasswordResetEmail(auth, email);
  const logout = async () => {
    const uid = auth.currentUser?.uid;
    await unregisterPush(uid);
    await signOut(auth);
    await clearLocalData();
    // Firestore can't be used after terminate(); a fresh page load re-initialises it.
    window.location.replace("/login");
  };

  // `remove` deletes fields from the public doc (e.g. migrating `gender` to private).
  const saveProfile = async (fields, { remove = [] } = {}) => {
    if (!auth.currentUser) return;
    const drops = Object.fromEntries(remove.map((k) => [k, deleteField()]));
    await setDoc(doc(db, "users", auth.currentUser.uid), { ...fields, ...drops, updatedAt: serverTimestamp() }, { merge: true });
    setProfile((p) => {
      const next = { ...(p || {}), ...fields };
      remove.forEach((k) => { delete next[k]; });
      return next;
    });
  };
  const saveInterests = async (interests) => {
    if (!auth.currentUser) return;
    await setDoc(doc(db, "users", auth.currentUser.uid), { interests, updatedAt: serverTimestamp() }, { merge: true });
    setProfile((p) => ({ ...(p || {}), interests }));
  };
  // Private fields (notificationPrefs, etc.) → owner-only users/{uid}/private/data
  const savePrivate = async (fields) => {
    if (!auth.currentUser) return;
    await setDoc(privDoc(auth.currentUser.uid), { ...fields, updatedAt: serverTimestamp() }, { merge: true });
    setProfile((p) => ({ ...(p || {}), ...fields }));
  };

  const reportContent = async ({ targetType, targetId, targetOwnerId, reason = "other", note = "" }) => {
    if (!user) return;
    await addDoc(collection(db, "reports"), {
      reporterId: user.uid, targetType, targetId, targetOwnerId: targetOwnerId || null,
      reason, note, status: "open", createdAt: serverTimestamp(),
    });
  };
  const blockUser = async (targetUid) => {
    if (!user || !targetUid || targetUid === user.uid) return;
    await setDoc(doc(db, "users", user.uid, "blocked", targetUid), { targetUid, createdAt: serverTimestamp() });
  };
  const unblockUser = async (targetUid) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "blocked", targetUid));
  };

  // Account deletion runs server-side (deleteAccount callable, Admin SDK). The old
  // client-side cascade failed for anyone whose content had a like or comment from
  // someone else (rules only let authors delete those) and left a half-deleted
  // account behind. The server also removes Storage files, DMs, trip plans,
  // verification selfies and the Auth account. It requires a recent sign-in.
  const deleteAccount = async () => {
    if (!auth.currentUser) return;
    try {
      await httpsCallable(functions, "deleteAccount")();
    } catch (e) {
      if (e.code === "functions/failed-precondition") {
        throw new Error("For your security, sign out and sign back in, then delete your account.", { cause: e });
      }
      throw new Error("We couldn't delete your account. Please try again.", { cause: e });
    }
    await signOut(auth).catch(() => {});
    await clearLocalData();
    window.location.replace("/login");
  };

  // GDPR data portability — download everything we hold about you as JSON.
  const exportMyData = async () => {
    const u = auth.currentUser;
    if (!u) return;
    const uid = u.uid;
    const dump = { exportedAt: new Date().toISOString(), account: { uid, email: u.email || null } };
    const colToArr = async (q) => { const s = await getDocs(q); return s.docs.map((d) => ({ id: d.id, ...d.data() })); };
    try {
      dump.profile = (await getDoc(doc(db, "users", uid))).data() || null;
      dump.private = (await getDoc(doc(db, "users", uid, "private", "data"))).data() || null;
      for (const sub of ["following", "saves", "blocked", "notifications", "references", "reviews"]) {
        dump[sub] = await colToArr(collection(db, "users", uid, sub));
      }
      dump.posts = await colToArr(query(collection(db, "posts"), where("authorId", "==", uid)));
      dump.activities = await colToArr(query(collection(db, "activities"), where("authorId", "==", uid)));
      dump.listings = await colToArr(query(collection(db, "listings"), where("sellerId", "==", uid)));
      dump.tribes = await colToArr(query(collection(db, "tribes"), where("ownerId", "==", uid)));
      dump.tripPlans = await colToArr(query(collection(db, "tripPlans"), where("ownerId", "==", uid)));
    } catch (e) { console.warn("export:", e.message); }
    const json = JSON.stringify(dump, (k, v) => (v && typeof v.toDate === "function" ? v.toDate().toISOString() : v), 2);
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url; a.download = `roamr-data-${uid}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <AuthContext.Provider value={{
      user, profile, profileStatus, blockedIds, loading,
      emailMethods, signInEmail, signUpEmail, googleSignIn, appleSignIn,
      resetPassword, logout, saveInterests, saveProfile, savePrivate,
      reportContent, blockUser, unblockUser, deleteAccount, exportMyData, resendVerification, followingIds, toggleFollow,
      notifications, unreadCount, markNotifsRead,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
