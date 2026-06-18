import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signInWithPopup, GoogleAuthProvider, OAuthProvider, signOut, sendPasswordResetEmail,
  fetchSignInMethodsForEmail, deleteUser, sendEmailVerification,
} from "firebase/auth";
import {
  doc, getDoc, setDoc, deleteDoc, addDoc, collection, collectionGroup, getDocs, query, where,
  onSnapshot, orderBy, limit, serverTimestamp,
} from "firebase/firestore";
import { ref as sref, listAll, deleteObject } from "firebase/storage";
import { auth, db, storage } from "../lib/firebase.js";
import { toggleSet } from "../lib/util.js";

const AuthContext = createContext(null);

// Private fields (email/phone/tokens/prefs) live in users/{uid}/private/data —
// readable ONLY by the owner. The users/{uid} doc holds public profile fields.
const privDoc = (uid) => doc(db, "users", uid, "private", "data");

// Recursively delete everything under a Storage path (best-effort).
async function deleteStoragePrefix(path) {
  try {
    const res = await listAll(sref(storage, path));
    await Promise.all(res.items.map((i) => deleteObject(i).catch(() => {})));
    await Promise.all(res.prefixes.map((pre) => deleteStoragePrefix(pre.fullPath)));
  } catch { /* nothing there / not permitted */ }
}

async function ensureUserDoc(user) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const pubBase = {
    displayName: user.displayName || null,
    photoURL: user.photoURL || null,
    updatedAt: serverTimestamp(),
  };
  const privBase = {
    email: user.email || null,
    phoneNumber: user.phoneNumber || null,
    updatedAt: serverTimestamp(),
  };
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid, ...pubBase, interests: [], bio: "",
      subscription: { tier: "basic", source: "manual", renewsAt: null, amount: null },
      followingCount: 0, followerCount: 0, createdAt: serverTimestamp(),
    });
    await setDoc(privDoc(user.uid), { ...privBase, fcmTokens: [], notificationPrefs: {}, createdAt: serverTimestamp() });
    return { isNew: true, interests: [] };
  }
  await setDoc(ref, pubBase, { merge: true });
  await setDoc(privDoc(user.uid), privBase, { merge: true });
  return { isNew: false, interests: snap.data().interests || [] };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [blockedIds, setBlockedIds] = useState(new Set());
  const [followingIds, setFollowingIds] = useState(new Set());
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const [pub, priv] = await Promise.all([
            getDoc(doc(db, "users", u.uid)),
            getDoc(privDoc(u.uid)),
          ]);
          setProfile({ ...(pub.exists() ? pub.data() : {}), ...(priv.exists() ? priv.data() : {}) });
        } catch { setProfile(null); }
      } else { setProfile(null); }
      setLoading(false);
    });
    return unsub;
  }, []);

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
  const googleSignIn = async () => afterAuth(await signInWithPopup(auth, new GoogleAuthProvider()));
  const appleSignIn = async () => {
    const p = new OAuthProvider("apple.com"); p.addScope("email"); p.addScope("name");
    return afterAuth(await signInWithPopup(auth, p));
  };
  const resetPassword = (email) => sendPasswordResetEmail(auth, email);
  const logout = () => signOut(auth);

  const saveProfile = async (fields) => {
    if (!auth.currentUser) return;
    await setDoc(doc(db, "users", auth.currentUser.uid), { ...fields, updatedAt: serverTimestamp() }, { merge: true });
    setProfile((p) => ({ ...(p || {}), ...fields }));
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

  // In-app account deletion (client teardown; robust fan-out is a Cloud Function later)
  const deleteAccount = async () => {
    const u = auth.currentUser;
    if (!u) return;
    const uid = u.uid;
    for (const grp of ["likes", "attendees", "members"]) {
      const qs = await getDocs(query(collectionGroup(db, grp), where("uid", "==", uid)));
      await Promise.all(qs.docs.map((d) => deleteDoc(d.ref)));
    }
    for (const sub of ["following", "saves", "blocked", "notifications", "private"]) {
      const qs = await getDocs(collection(db, "users", uid, sub));
      await Promise.all(qs.docs.map((d) => deleteDoc(d.ref)));
    }
    for (const [coll, field, subs] of [
      ["posts", "authorId", ["likes", "comments"]],
      ["activities", "authorId", ["likes", "comments", "attendees"]],
      ["tribes", "ownerId", ["members"]],
      ["listings", "sellerId", []],
    ]) {
      const qs = await getDocs(query(collection(db, coll), where(field, "==", uid)));
      for (const d of qs.docs) {
        for (const sub of subs) {
          const sq = await getDocs(collection(d.ref, sub));
          await Promise.all(sq.docs.map((x) => deleteDoc(x.ref)));
        }
        await deleteDoc(d.ref);
      }
    }
    await Promise.all(["avatars", "posts", "activities", "listings"].map((pfx) => deleteStoragePrefix(`${pfx}/${uid}`)));
    await deleteDoc(doc(db, "users", uid));
    await deleteUser(u);
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
      user, profile, blockedIds, loading,
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
