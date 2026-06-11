import { createContext, useContext, useEffect, useState } from "react";
import {
  collection, collectionGroup, addDoc, setDoc, deleteDoc, updateDoc, doc,
  onSnapshot, query, orderBy, where, limit, serverTimestamp, increment, arrayUnion, arrayRemove,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../lib/firebase.js";
import { tapLight, tapSuccess } from "../lib/haptics.js";
import { compressImage } from "../lib/image.js";
import { toggleSet } from "../lib/util.js";
import { track } from "../lib/analytics.js";
import { useAuth } from "./AuthContext.jsx";
import { activities as seed } from "../data/activities.js";

const ActivitiesContext = createContext(null);

export function ActivitiesProvider({ children }) {
  const { user, profile, blockedIds } = useAuth();
  const [remote, setRemote] = useState([]);
  const [joinedIds, setJoinedIds] = useState(new Set());
  const [likedIds, setLikedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "activities"), orderBy("createdAt", "desc"), limit(20));
    return onSnapshot(
      q,
      (snap) => { setRemote(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setLoading(false); },
      (err) => { console.warn("Firestore activities:", err.message); setLoading(false); }
    );
  }, []);

  useEffect(() => {
    if (!user) { setJoinedIds(new Set()); setLikedIds(new Set()); return; }
    const ja = onSnapshot(
      query(collectionGroup(db, "attendees"), where("uid", "==", user.uid)),
      (snap) => { const s = new Set(); snap.forEach((d) => { const p = d.ref.parent.parent; if (p) s.add(p.id); }); setJoinedIds(s); },
      (e) => console.warn("attendees:", e.message)
    );
    const la = onSnapshot(
      query(collectionGroup(db, "likes"), where("uid", "==", user.uid)),
      (snap) => { const s = new Set(); snap.forEach((d) => { const p = d.ref.parent.parent; if (p && p.parent.id === "activities") s.add(p.id); }); setLikedIds(s); },
      (e) => console.warn("activity likes:", e.message)
    );
    return () => { ja(); la(); };
  }, [user]);

  const base = remote.length ? remote : (import.meta.env.DEV ? seed : []);
  const activities = base.filter((a) => !blockedIds.has(a.authorId));

  const addActivity = async ({ text, file }) => {
    if (!user) return;
    let photo = null;
    if (file) {
      const up = await compressImage(file);
      const snap = await uploadBytes(ref(storage, `activities/${user.uid}/${Date.now()}-${up.name}`), up);
      photo = await getDownloadURL(snap.ref);
    }
    await addDoc(collection(db, "activities"), {
      authorId: user.uid,
      authorName: profile?.displayName || user.displayName || (user.email ? user.email.split("@")[0] : "Explorer"),
      authorPhotoURL: profile?.photoURL || user.photoURL || null,
      text, photo,
      attendeeCount: 0, recentAttendees: [], likeCount: 0, commentCount: 0,
      createdAt: serverTimestamp(),
    });
    tapSuccess();
    track("create_success", { type: "activity" });
  };

  const me = () => ({
    uid: user.uid,
    displayName: profile?.displayName || user.displayName || "Explorer",
    photoURL: profile?.photoURL || user.photoURL || null,
  });

  const toggleAttend = async (act) => {
    if (!user) return;
    const id = act.id;
    const isRemote = remote.some((a) => a.id === id);
    const was = joinedIds.has(id);
    tapLight();
    setJoinedIds((prev) => toggleSet(prev, id));
    if (!isRemote) return;
    try {
      const aref = doc(db, "activities", id, "attendees", user.uid);
      const tref = doc(db, "activities", id);
      const meDoc = me();
      if (was) { await deleteDoc(aref); }            // attendeeCount + recentAttendees maintained by Cloud Function
      else { await setDoc(aref, { ...meDoc, createdAt: serverTimestamp() }); track("activity_join"); }
    } catch (e) {
      setJoinedIds((prev) => toggleSet(prev, id));
      console.warn("attend:", e.message);
    }
  };

  const toggleLike = async (act) => {
    if (!user) return;
    const id = act.id;
    const isRemote = remote.some((a) => a.id === id);
    const was = likedIds.has(id);
    tapLight();
    setLikedIds((prev) => toggleSet(prev, id));
    if (!isRemote) return;
    try {
      const lref = doc(db, "activities", id, "likes", user.uid);
      const tref = doc(db, "activities", id);
      if (was) { await deleteDoc(lref); }            // likeCount maintained by Cloud Function
      else { await setDoc(lref, { uid: user.uid, createdAt: serverTimestamp() }); }
    } catch (e) {
      setLikedIds((prev) => toggleSet(prev, id));
      console.warn("activity like:", e.message);
    }
  };

  return (
    <ActivitiesContext.Provider value={{ activities, loading, joinedIds, likedIds, addActivity, toggleAttend, toggleLike }}>
      {children}
    </ActivitiesContext.Provider>
  );
}

export const useActivities = () => useContext(ActivitiesContext);
