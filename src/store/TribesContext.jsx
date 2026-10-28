import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  collection, collectionGroup, addDoc, setDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, where, limit, serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "../lib/firebase.js";
import { tapLight, tapSuccess } from "../lib/haptics.js";
import { compressImage } from "../lib/image.js";
import { toggleSet, isDemoId } from "../lib/util.js";
import { track } from "../lib/analytics.js";
import { useAuth } from "./AuthContext.jsx";
import { tribes as seed } from "../data/tribes.js";

const TribesContext = createContext(null);

export function TribesProvider({ children }) {
  const { user } = useAuth();
  const [remote, setRemote] = useState([]);
  const [joinedIds, setJoinedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const pending = useRef(new Set());

  // Re-subscribes when the signed-in user changes (see PostsContext for why).
  const uid = user?.uid;
  useEffect(() => {
    if (!uid) { setRemote([]); setLoading(false); return; }
    setLoading(true);
    const q = query(collection(db, "tribes"), orderBy("createdAt", "desc"), limit(50));
    return onSnapshot(
      q,
      (snap) => { setRemote(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setLoading(false); },
      (err) => { console.warn("Firestore tribes:", err.message); setLoading(false); }
    );
  }, [uid]);

  useEffect(() => {
    if (!uid) { setJoinedIds(new Set()); return; }
    const q = query(collectionGroup(db, "members"), where("uid", "==", uid));
    return onSnapshot(
      q,
      (snap) => {
        const s = new Set();
        snap.forEach((d) => { const t = d.ref.parent.parent; if (t) s.add(t.id); });
        setJoinedIds(s);
      },
      (err) => console.warn("Firestore memberships:", err.message)
    );
  }, [uid]);

  const tribes = remote.length ? remote : (import.meta.env.DEV ? seed : []);

  const addTribe = async ({ name, file, categories = [], location = "", description = "" }) => {
    const owner = auth.currentUser?.uid || null;
    let img = null;
    if (file && owner) {
      const up = await compressImage(file);
      const snap = await uploadBytes(ref(storage, `tribes/${owner}/${Date.now()}-${up.name}`), up);
      img = await getDownloadURL(snap.ref);
    }
    const docRef = await addDoc(collection(db, "tribes"), {
      name, img, categories: categories || [], location: location || "", description: description || "",
      memberCount: 0, ownerId: owner, createdAt: serverTimestamp(),
    });
    if (owner) {
      await setDoc(doc(db, "tribes", docRef.id, "members", owner),
        { uid: owner, role: "owner", createdAt: serverTimestamp() });
    }
    tapSuccess();
    track("create_success", { type: "tribe" });
    return docRef.id;
  };

  // Writes for any real tribe (the old in-window check skipped tribes outside the
  // newest 50, so accepting an invite to an older tribe silently did nothing).
  const toggleMembership = async (tribe) => {
    if (!user) return;
    const id = tribe.id;
    const wasJoined = joinedIds.has(id);
    // The owner can't "leave" their own tribe — that locked them out of its chat.
    if (wasJoined && tribe.ownerId === user.uid) return;
    if (pending.current.has(id)) return;
    tapLight();
    setJoinedIds((prev) => toggleSet(prev, id));
    if (isDemoId(id)) return;
    pending.current.add(id);
    try {
      const mref = doc(db, "tribes", id, "members", user.uid);
      if (wasJoined) { await deleteDoc(mref); }
      else {
        await setDoc(mref, {
          uid: user.uid,
          role: tribe.ownerId === user.uid ? "owner" : "member",
          createdAt: serverTimestamp(),
        });
        track("tribe_join");
      }
    } catch (e) {
      setJoinedIds((prev) => toggleSet(prev, id));
      console.warn("membership:", e.message);
    } finally { pending.current.delete(id); }
  };

  return (
    <TribesContext.Provider value={{ tribes, loading, joinedIds, addTribe, toggleMembership }}>
      {children}
    </TribesContext.Provider>
  );
}

export const useTribes = () => useContext(TribesContext);
