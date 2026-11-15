import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  collection, collectionGroup, addDoc, setDoc, deleteDoc, doc, getDocFromServer,
  onSnapshot, query, orderBy, where, limit, serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "../lib/firebase.js";
import { tapLight, tapSuccess } from "../lib/haptics.js";
import { compressImage, requireOnlineForPhotos } from "../lib/image.js";
import { toggleSet, isDemoId, membershipState } from "../lib/util.js";
import { track } from "../lib/analytics.js";
import { useAuth } from "./AuthContext.jsx";
import { tribes as seed } from "../data/tribes.js";

const TribesContext = createContext(null);

export function TribesProvider({ children }) {
  const { user } = useAuth();
  const [remote, setRemote] = useState([]);
  const [joinedIds, setJoinedIds] = useState(new Set());
  // Memberships the server has recorded. The tribe chat opens (and Send unlocks) only
  // for these, because the chat rules check the member doc on the server.
  const [confirmedIds, setConfirmedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const inflight = useRef(new Map()); // tribeId -> "join" | "leave" while the write is in flight

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
    if (!uid) { setJoinedIds(new Set()); setConfirmedIds(new Set()); return; }
    const q = query(collectionGroup(db, "members"), where("uid", "==", uid));
    // This one query is the only membership listener. TribeDetail used to open a second,
    // single-doc listener on members/{uid}; when that listener started before the doc
    // existed, the SDK could later synthesize a "deleted" for it right after the join was
    // acknowledged, which wiped the membership from the local cache: the tribe flipped
    // back to "Join", the composer unmounted and Send stayed disabled (synthetic-users
    // join_tribe_and_chat). includeMetadataChanges delivers the server ack, which is
    // when a membership becomes confirmed.
    return onSnapshot(
      q, { includeMetadataChanges: true },
      (snap) => {
        const docs = snap.docs.map((d) => ({ tribeId: d.ref.parent.parent?.id, pending: d.metadata.hasPendingWrites }));
        const { joined, confirmed } = membershipState(docs, inflight.current);
        setJoinedIds(joined);
        setConfirmedIds(confirmed);
      },
      (err) => console.warn("Firestore memberships:", err.message)
    );
  }, [uid]);

  const tribes = remote.length ? remote : (import.meta.env.DEV ? seed : []);

  const addTribe = async ({ name, file, categories = [], location = "", description = "" }) => {
    const owner = auth.currentUser?.uid || null;
    requireOnlineForPhotos(!!file);
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
    if (inflight.current.has(id)) return;
    tapLight();
    setJoinedIds((prev) => toggleSet(prev, id));
    if (wasJoined) setConfirmedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    if (isDemoId(id)) return;
    inflight.current.set(id, wasJoined ? "leave" : "join");
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
    } finally { inflight.current.delete(id); }
  };

  // Fallback for a chat stuck on "connecting": ask the server directly whether the
  // membership exists. Returns true if it does (the chat can open).
  const recheckMembership = async (id) => {
    if (!user || isDemoId(id)) return false;
    const s = await getDocFromServer(doc(db, "tribes", id, "members", user.uid));
    if (!s.exists()) return false;
    setJoinedIds((prev) => new Set(prev).add(id));
    setConfirmedIds((prev) => new Set(prev).add(id));
    return true;
  };

  return (
    <TribesContext.Provider value={{ tribes, loading, joinedIds, confirmedIds, addTribe, toggleMembership, recheckMembership }}>
      {children}
    </TribesContext.Provider>
  );
}

export const useTribes = () => useContext(TribesContext);
