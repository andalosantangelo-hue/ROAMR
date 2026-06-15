import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  collection, doc, getDoc, addDoc, updateDoc, onSnapshot, query, orderBy, limit, serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase.js";
import { useAuth } from "../store/AuthContext.jsx";
import StatusBar from "../components/StatusBar.jsx";
import ChatThread from "../components/ChatThread.jsx";
import { Profile as UserIcon } from "../components/Icons.jsx";

export default function Chat() {
  const { threadId } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [meta, setMeta] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    getDoc(doc(db, "threads", threadId))
      .then((s) => setMeta(s.exists() ? s.data() : null))
      .catch(() => setMeta(null));
  }, [threadId]);

  useEffect(() => {
    const q = query(collection(db, "threads", threadId, "messages"), orderBy("createdAt", "asc"), limit(200));
    return onSnapshot(q,
      (snap) => setMessages(snap.docs.map((d) => ({ id: d.id, uid: d.data().senderId, text: d.data().text, createdAt: d.data().createdAt }))),
      (e) => console.warn("dm messages:", e.message));
  }, [threadId]);

  const otherUid = meta?.participants?.find((u) => u !== user?.uid);
  const otherName = (meta?.participantNames && otherUid && meta.participantNames[otherUid]) || "Conversation";
  const otherPhoto = (meta?.participantPhotos && otherUid && meta.participantPhotos[otherUid]) || "";

  const send = async (text) => {
    await addDoc(collection(db, "threads", threadId, "messages"), {
      senderId: user.uid, text, createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, "threads", threadId), { lastMessage: text, lastAt: serverTimestamp() });
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <StatusBar />
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-black/5">
        <button onClick={() => nav(-1)} aria-label="Back" className="text-brand-navy text-2xl leading-none">‹</button>
        <button onClick={() => otherUid && nav(`/u/${otherUid}`)} className="flex items-center gap-2.5 min-w-0">
          {otherPhoto ? (
            <img src={otherPhoto} alt="" className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <span className="w-9 h-9 rounded-full bg-brand-navy text-brand-greenBright grid place-items-center">
              <UserIcon className="w-5 h-5" />
            </span>
          )}
          <span className="font-semibold text-brand-navy truncate">{otherName}</span>
        </button>
      </div>
      <ChatThread messages={messages} meUid={user?.uid} onSend={send} placeholder={`Message ${otherName}…`} />
    </div>
  );
}
