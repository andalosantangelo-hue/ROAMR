import { createContext, useContext, useEffect, useState } from "react";
import {
  collection, collectionGroup, addDoc, setDoc, deleteDoc, updateDoc, doc,
  onSnapshot, query, orderBy, where, limit, serverTimestamp, increment,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "../lib/firebase.js";
import { tapLight, tapSuccess } from "../lib/haptics.js";
import { compressImage } from "../lib/image.js";
import { toggleSet } from "../lib/util.js";
import { track } from "../lib/analytics.js";
import { useAuth } from "./AuthContext.jsx";
import { tribes as seed } from "../data/tribes.js";

const TribesContext = createContext(null);

export function TribesProvider({ children }) {
  const { user } = useAuth();
  const [remote, setRemote] = useState([]);
  const [joinedIds, setJoinedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  // Live tribes list
  useEffect(() => {
    const q = query(collection(db, "tribes"), orderBy("createdAt", "desc"), limit(50));
    return onSnapshot(
      q,
      (snap) => { setRemote(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setLoading(false); },
      (err) => { console.warn("Firestore tribes:", err.message); setLoading(false); }
    );
  }, []);

  // Which tribes the signed-in user belongs to (presence docs)
  useEffect(() => {
    if (!user) { setJoinedIds(new Set()); return; }
    const q = query(collectionGroup(db, "members"), where("uid", "==", user.uid));
    return onSnapshot(
      q,
      (snap) => {
        const s = new Set();
        snap.forEach((d) => { const t = d.ref.parent.parent; if (t) s.add(t.id); });
        setJoinedIds(s);
      },
      (err) => console.warn("Firestore memberships:", err.message)
    );
  }, [user]);

  const tribes = remote.length ? remote : (import.meta.env.DEV ? seed : []);

  const addTribe = async ({ name, file, category = null }) => {
    let img = null;
    if (file) {
      const up = await compressImage(file);
      const snap = await uploadBytes(ref(storage, `tribes/${Date.now()}-${up.name}`), up);
      img = await getDownloadURL(snap.ref);
    }
    const uid = auth.currentUser?.uid || null;
    const docRef = await addDoc(collection(db, "tribes"), {
      name, img, category, memberCount: 0, ownerId: uid, createdAt: serverTimestamp(), // owner member doc triggers +1
    });
    if (uid) {
      await setDoc(doc(db, "tribes", docRef.id, "members", uid),
        { uid, role: "owner", createdAt: serverTimestamp() });
    }
    tapSuccess();
    track("create_success", { type: "tribe" });
  };

  // Optimistic join/leave (§8.1). Demo-seed tribes (no Firestore doc) flip locally only.
  const toggleMembership = async (tribe) => {
    if (!user) return;
    const id = tribe.id;
    const isRemote = remote.some((t) => t.id === id);
    const wasJoined = joinedIds.has(id);
    tapLight();
    setJoinedIds((prev) => toggleSet(prev, id));
    if (!isRemote) return;

    try {
      const mref = doc(db, "tribes", id, "members", user.uid);
      const tref = doc(db, "tribes", id);
      if (wasJoined) { await deleteDoc(mref); }       // memberCount maintained by Cloud Function
      else {
        await setDoc(mref, {
          uid: user.uid,
          role: tribe.ownerId === user.uid ? "owner" : "member",
          createdAt: serverTimestamp(),
        });
        track("tribe_join");
      }
    } catch (e) {
      setJoinedIds((prev) => toggleSet(prev, id)); // revert
      console.warn("membership:", e.message);
    }
  };

  return (
    <TribesContext.Provider value={{ tribes, loading, joinedIds, addTribe, toggleMembership }}>
      {children}
    </TribesContext.Provider>
  );
}

export const useTribes = () => useContext(TribesContext);
