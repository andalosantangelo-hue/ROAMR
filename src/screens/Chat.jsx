import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  collection, doc, getDoc, addDoc, updateDoc, onSnapshot, query, orderBy, limit, serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase.js";
import { useAuth } from "../store/AuthContext.jsx";
import StatusBar from "../components/StatusBar.jsx";
import ChatThread from "../components/ChatThread.jsx";
import { Profile as UserIcon, More } from "../components/Icons.jsx";

export default function Chat() {
  const { threadId } = useParams();
  const nav = useNavigate();
  const { user, reportContent, blockUser } = useAuth();
  const [meta, setMeta] = useState(null);
  const [messages, setMessages] = useState([]);
  const [menu, setMenu] = useState(false);
  const [notice, setNotice] = useState("");

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

  const report = async () => {
    setMenu(false);
    try {
      await reportContent({ targetType: "dm", targetId: threadId, targetOwnerId: otherUid, reason: "harassment" });
      setNotice("Reported. Our team will review this conversation.");
    } catch (e) { setNotice(e.message || "Could not report."); }
  };
  const block = async () => {
    setMenu(false);
    try { if (otherUid) await blockUser(otherUid); nav("/messages"); }
    catch (e) { setNotice(e.message || "Could not block."); }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <StatusBar />
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-black/5 relative">
        <button onClick={() => nav(-1)} aria-label="Back" className="text-brand-navy text-2xl leading-none">‹</button>
        <button onClick={() => otherUid && nav(`/u/${otherUid}`)} className="flex items-center gap-2.5 min-w-0 flex-1">
          {otherPhoto ? (
            <img src={otherPhoto} alt="" className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <span className="w-9 h-9 rounded-full bg-brand-navy text-brand-greenBright grid place-items-center">
              <UserIcon className="w-5 h-5" />
            </span>
          )}
          <span className="font-semibold text-brand-navy truncate">{otherName}</span>
        </button>
        <button onClick={() => setMenu((v) => !v)} aria-label="More options" className="text-brand-navy/70 p-1">
          <More className="w-5 h-5" />
        </button>
        {menu && (
          <div className="absolute right-3 top-12 z-20 bg-white rounded-xl shadow-card border border-black/5 overflow-hidden w-44">
            <button onClick={report} className="w-full text-left px-4 py-3 text-sm font-medium text-ink hover:bg-brand-tint">Report conversation</button>
            <button onClick={block} className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-brand-tint">Block &amp; leave</button>
          </div>
        )}
      </div>
      {notice && <p className="text-center text-brand-green text-[13px] py-2 px-4 bg-brand-tint">{notice}</p>}
      <ChatThread messages={messages} meUid={user?.uid} onSend={send} placeholder={`Message ${otherName}…`} />
    </div>
  );
}
