import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  collection, collectionGroup, addDoc, setDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, where, limit, serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../lib/firebase.js";
import { tapLight, tapSuccess } from "../lib/haptics.js";
import { compressImage, writeOrQueue, requireOnlineForPhotos } from "../lib/image.js";
import { toggleSet, isDemoId } from "../lib/util.js";
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
  const pending = useRef(new Set()); // ids with a write in flight (ignores double taps)

  // Re-subscribes when the signed-in user changes (see PostsContext for why).
  const uid = user?.uid;
  useEffect(() => {
    if (!uid) { setRemote([]); setLoading(false); return; }
    setLoading(true);
    const q = query(collection(db, "activities"), orderBy("createdAt", "desc"), limit(20));
    return onSnapshot(
      q,
      (snap) => { setRemote(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setLoading(false); },
      (err) => { console.warn("Firestore activities:", err.message); setLoading(false); }
    );
  }, [uid]);

  useEffect(() => {
    if (!uid) { setJoinedIds(new Set()); setLikedIds(new Set()); return; }
    const ja = onSnapshot(
      query(collectionGroup(db, "attendees"), where("uid", "==", uid)),
      (snap) => { const s = new Set(); snap.forEach((d) => { const p = d.ref.parent.parent; if (p) s.add(p.id); }); setJoinedIds(s); },
      (e) => console.warn("attendees:", e.message)
    );
    const la = onSnapshot(
      query(collectionGroup(db, "likes"), where("uid", "==", uid)),
      (snap) => { const s = new Set(); snap.forEach((d) => { const p = d.ref.parent.parent; if (p && p.parent.id === "activities") s.add(p.id); }); setLikedIds(s); },
      (e) => console.warn("activity likes:", e.message)
    );
    return () => { ja(); la(); };
  }, [uid]);

  const base = remote.length ? remote : (import.meta.env.DEV ? seed : []);
  const activities = base.filter((a) => !blockedIds.has(a.authorId));

  const addActivity = async ({ text, location = "", when = "", skillLevel = "All Levels", dmOpen = true, file }) => {
    if (!user) return;
    requireOnlineForPhotos(!!file);
    let photo = null;
    if (file) {
      const up = await compressImage(file);
      const snap = await uploadBytes(ref(storage, `activities/${user.uid}/${Date.now()}-${up.name}`), up);
      photo = await getDownloadURL(snap.ref);
    }
    await writeOrQueue(addDoc(collection(db, "activities"), {
      authorId: user.uid,
      authorName: (profile?.displayName || user.displayName || (user.email ? user.email.split("@")[0] : "Explorer")).slice(0, 40),
      authorPhotoURL: profile?.photoURL || user.photoURL || null,
      text, photo,
      location: location || "", when: when || null, skillLevel: skillLevel || "All Levels", dmOpen: dmOpen !== false,
      attendeeCount: 0, recentAttendees: [], likeCount: 0, commentCount: 0,
      createdAt: serverTimestamp(),
    }));
    tapSuccess();
    track("create_success", { type: "activity" });
  };

  const me = () => ({
    uid: user.uid,
    displayName: (profile?.displayName || user.displayName || "Explorer").slice(0, 40),
    photoURL: profile?.photoURL || user.photoURL || null,
  });

  // Writes for any real activity, including ones outside the newest 20 (opened from an
  // invite link or a profile). The old in-window check skipped those writes silently.
  const toggleAttend = async (act) => {
    if (!user) return;
    const id = act.id;
    if (pending.current.has(`join:${id}`)) return;
    const was = joinedIds.has(id);
    tapLight();
    setJoinedIds((prev) => toggleSet(prev, id));
    if (isDemoId(id)) return;
    pending.current.add(`join:${id}`);
    try {
      const aref = doc(db, "activities", id, "attendees", user.uid);
      if (was) { await deleteDoc(aref); }
      else { await setDoc(aref, { ...me(), createdAt: serverTimestamp() }); track("activity_join"); }
    } catch (e) {
      setJoinedIds((prev) => toggleSet(prev, id));
      console.warn("attend:", e.message);
    } finally { pending.current.delete(`join:${id}`); }
  };

  const toggleLike = async (act) => {
    if (!user) return;
    const id = act.id;
    if (pending.current.has(`like:${id}`)) return;
    const was = likedIds.has(id);
    tapLight();
    setLikedIds((prev) => toggleSet(prev, id));
    if (isDemoId(id)) return;
    pending.current.add(`like:${id}`);
    try {
      const lref = doc(db, "activities", id, "likes", user.uid);
      if (was) { await deleteDoc(lref); }
      else { await setDoc(lref, { uid: user.uid, createdAt: serverTimestamp() }); }
    } catch (e) {
      setLikedIds((prev) => toggleSet(prev, id));
      console.warn("activity like:", e.message);
    } finally { pending.current.delete(`like:${id}`); }
  };

  return (
    <ActivitiesContext.Provider value={{ activities, loading, joinedIds, likedIds, addActivity, toggleAttend, toggleLike }}>
      {children}
    </ActivitiesContext.Provider>
  );
}

export const useActivities = () => useContext(ActivitiesContext);
