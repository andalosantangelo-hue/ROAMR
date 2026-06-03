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
import { auth, db } from "../lib/firebase.js";
import { toggleSet } from "../lib/util.js";

const AuthContext = createContext(null);

async function ensureUserDoc(user) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const base = {
    displayName: user.displayName || null,
    email: user.email || null,
    phoneNumber: user.phoneNumber || null,
    photoURL: user.photoURL || null,
    updatedAt: serverTimestamp(),
  };
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid, ...base, interests: [], bio: "",
      subscription: { tier: "basic", source: "manual", renewsAt: null, amount: null },
      followingCount: 0, followerCount: 0, createdAt: serverTimestamp(),
    });
    return { isNew: true, interests: [] };
  }
  await setDoc(ref, base, { merge: true });
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
          const snap = await getDoc(doc(db, "users", u.uid));
          setProfile(snap.exists() ? snap.data() : null);
        } catch { setProfile(null); }
      } else { setProfile(null); }
      setLoading(false);
    });
    return unsub;
  }, []);

  // Blocked users (for content filtering, §9.A.3)
  useEffect(() => {
    if (!user) { setBlockedIds(new Set()); return; }
    return onSnapshot(
      collection(db, "users", user.uid, "blocked"),
      (snap) => setBlockedIds(new Set(snap.docs.map((d) => d.id))),
      (e) => console.warn("blocked:", e.message)
    );
  }, [user]);

  // Who I follow (drives Follow buttons). Counts maintained by Cloud Function.
  useEffect(() => {
    if (!user) { setFollowingIds(new Set()); return; }
    return onSnapshot(
      collection(db, "users", user.uid, "following"),
      (snap) => setFollowingIds(new Set(snap.docs.map((d) => d.id))),
      (e) => console.warn("following:", e.message)
    );
  }, [user]);

  // In-app notification inbox (written by Cloud Functions)
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
    setFollowingIds((p) => toggleSet(p, targetUid)); // optimistic
    try {
      const ref = doc(db, "users", user.uid, "following", targetUid);
      if (was) await deleteDoc(ref);
      else await setDoc(ref, { targetUid, createdAt: serverTimestamp() });
    } catch (e) {
      setFollowingIds((p) => toggleSet(p, targetUid)); // rollback
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

  // §9.A.3 — report + block
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

  // §9.A.1 — in-app account deletion (client teardown; robust fan-out is a Cloud Function later)
  const deleteAccount = async () => {
    const u = auth.currentUser;
    if (!u) return;
    const uid = u.uid;
    // 1. Remove my presence docs everywhere — the Cloud Functions decrement the
    //    parent counters (likeCount/attendeeCount/memberCount, follower counts).
    for (const grp of ["likes", "attendees", "members"]) {
      const qs = await getDocs(query(collectionGroup(db, grp), where("uid", "==", uid)));
      await Promise.all(qs.docs.map((d) => deleteDoc(d.ref)));
    }
    // 2. My own subcollections (following deletes drive follower-count decrements)
    for (const sub of ["following", "saves", "blocked"]) {
      const qs = await getDocs(collection(db, "users", uid, sub));
      await Promise.all(qs.docs.map((d) => deleteDoc(d.ref)));
    }
    // 3. My owned top-level content
    for (const [coll, field] of [["posts", "authorId"], ["activities", "authorId"], ["listings", "sellerId"], ["tribes", "ownerId"]]) {
      const qs = await getDocs(query(collection(db, coll), where(field, "==", uid)));
      await Promise.all(qs.docs.map((d) => deleteDoc(d.ref)));
    }
    // 4. Identity doc, then the auth user last
    await deleteDoc(doc(db, "users", uid));
    await deleteUser(u); // throws auth/requires-recent-login if session stale
  };

  return (
    <AuthContext.Provider value={{
      user, profile, blockedIds, loading,
      emailMethods, signInEmail, signUpEmail, googleSignIn, appleSignIn,
      resetPassword, logout, saveInterests, saveProfile,
      reportContent, blockUser, unblockUser, deleteAccount, resendVerification, followingIds, toggleFollow,
      notifications, unreadCount, markNotifsRead,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
