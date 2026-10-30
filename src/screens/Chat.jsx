import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  collection, doc, addDoc, updateDoc, onSnapshot, query, orderBy, limitToLast, serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase.js";
import { useAuth } from "../store/AuthContext.jsx";
import StatusBar from "../components/StatusBar.jsx";
import ChatThread from "../components/ChatThread.jsx";
import { Profile as UserIcon, More } from "../components/Icons.jsx";
import { SkeletonCircle, SkeletonLine } from "../components/skeletons";

export default function Chat() {
  const { threadId } = useParams();
  const nav = useNavigate();
  const { user, reportContent, blockUser } = useAuth();
  const [meta, setMeta] = useState(undefined); // undefined = loading, null = missing
  const [messages, setMessages] = useState(null); // null until the first snapshot
  const [menu, setMenu] = useState(false);
  const [notice, setNotice] = useState("");

  // Live, so the other person's name/photo appear as soon as the server fills them in.
  useEffect(() => onSnapshot(doc(db, "threads", threadId),
    (s) => setMeta(s.exists() ? s.data() : null),
    () => setMeta(null)), [threadId]);

  // limitToLast: the newest 100 messages. limit(200) on an ascending query returned the
  // OLDEST 200, so from message 201 on, new messages never appeared.
  useEffect(() => {
    const q = query(collection(db, "threads", threadId, "messages"), orderBy("createdAt", "asc"), limitToLast(100));
    return onSnapshot(q,
      (snap) => setMessages(snap.docs.map((d) => ({ id: d.id, uid: d.data().senderId, text: d.data().text, createdAt: d.data().createdAt }))),
      (e) => { console.warn("dm messages:", e.message); setMessages([]); });
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
          {meta === undefined ? (
            <span role="status" aria-busy="true" aria-label="Loading conversation" className="flex items-center gap-2.5"><SkeletonCircle className="w-9 h-9" /><SkeletonLine box="h-6" bar="h-3" className="w-28" /></span>
          ) : otherPhoto ? (
            <img src={otherPhoto} alt="" className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <span className="w-9 h-9 rounded-full bg-brand-navy text-brand-greenBright grid place-items-center">
              <UserIcon className="w-5 h-5" />
            </span>
          )}
          {meta !== undefined && <span className="font-semibold text-brand-navy truncate">{otherName}</span>}
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
      <ChatThread messages={messages || []} loading={messages === null} meUid={user?.uid} onSend={send} placeholder={`Message ${otherName}…`} />
    </div>
  );
}
