import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  collection, doc, getDoc, setDoc, onSnapshot, query, where, orderBy, limit, serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase.js";
import { dmThreadId } from "../lib/chat.js";
import { useAuth } from "./AuthContext.jsx";

const MessagesContext = createContext(null);

export function MessagesProvider({ children }) {
  const { user, blockedIds } = useAuth();
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
      // Participants are stored sorted (the rules bind the thread id to them), and
      // names/photos are left empty — the server fills them from real profiles so
      // nobody can open a conversation posing as someone else.
      try {
        await setDoc(ref, {
          participants: [user.uid, other.uid].sort(),
          participantNames: {},
          participantPhotos: {},
          lastMessage: "",
          lastAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        });
      } catch (e) {
        if (e.code === "permission-denied") {
          throw new Error(`${other.name || "This person"} only accepts messages from certain people right now.`, { cause: e });
        }
        throw e;
      }
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
