import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  collection, doc, getDoc, setDoc, onSnapshot, query, where, orderBy, limit, serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase.js";
import { dmThreadId } from "../lib/chat.js";
import { useAuth } from "./AuthContext.jsx";

const MessagesContext = createContext(null);

export function MessagesProvider({ children }) {
  const { user, profile, blockedIds } = useAuth();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setThreads([]); setLoading(false); return; }
    const q = query(
      collection(db, "threads"),
      where("participants", "array-contains", user.uid),
      orderBy("lastAt", "desc"),
      limit(50)
    );
    return onSnapshot(
      q,
      (snap) => { setThreads(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setLoading(false); },
      (err) => { console.warn("threads:", err.message); setLoading(false); }
    );
  }, [user]);

  // Hide conversations with people you've blocked.
  const visibleThreads = useMemo(() => threads.filter((t) => {
    const other = (t.participants || []).find((u) => u !== user?.uid);
    return !(other && blockedIds?.has(other));
  }), [threads, blockedIds, user]);

  // Ensure a 1:1 thread exists; returns its id. Refuses if either side has blocked the other.
  const openThread = async (other) => {
    if (!user || !other?.uid) return null;
    if (blockedIds?.has(other.uid)) throw new Error("You've blocked this person. Unblock them to message.");
    const tid = dmThreadId(user.uid, other.uid);
    const ref = doc(db, "threads", tid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const myName = profile?.displayName || user.displayName || (user.email ? user.email.split("@")[0] : "Explorer");
      await setDoc(ref, {
        participants: [user.uid, other.uid],
        participantNames: { [user.uid]: myName, [other.uid]: other.name || "Explorer" },
        participantPhotos: { [user.uid]: profile?.photoURL || user.photoURL || "", [other.uid]: other.photo || "" },
        lastMessage: "",
        lastAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
    }
    return tid;
  };

  return (
    <MessagesContext.Provider value={{ threads: visibleThreads, loading, openThread }}>
      {children}
    </MessagesContext.Provider>
  );
}

export const useMessages = () => useContext(MessagesContext);
