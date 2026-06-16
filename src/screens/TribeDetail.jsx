import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  collection, doc, getDoc, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase.js";
import { useAuth } from "../store/AuthContext.jsx";
import { useTribes } from "../store/TribesContext.jsx";
import StatusBar from "../components/StatusBar.jsx";
import ChatThread from "../components/ChatThread.jsx";
import JoinButton from "../components/JoinButton.jsx";
import { Tribes as TribesIcon, More } from "../components/Icons.jsx";

const CAT_LABELS = { outdoor: "Outdoor", water: "Water", wheel: "Wheels", nature: "Nature", snow: "Snow" };

export default function TribeDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, profile, blockedIds, reportContent } = useAuth();
  const { tribes, joinedIds, toggleMembership } = useTribes();
  const [tribe, setTribe] = useState(() => tribes.find((t) => t.id === id) || null);
  const [messages, setMessages] = useState([]);
  const [menu, setMenu] = useState(false);
  const [notice, setNotice] = useState("");
  const joined = joinedIds.has(id);

  useEffect(() => {
    const local = tribes.find((t) => t.id === id);
    if (local) { setTribe(local); return; }
    getDoc(doc(db, "tribes", id)).then((s) => s.exists() && setTribe({ id: s.id, ...s.data() })).catch(() => {});
  }, [id, tribes]);

  useEffect(() => {
    if (!joined) { setMessages([]); return; }
    const q = query(collection(db, "tribes", id, "messages"), orderBy("createdAt", "asc"), limit(200));
    return onSnapshot(q,
      (snap) => setMessages(snap.docs.map((d) => ({
        id: d.id, uid: d.data().authorId, name: d.data().authorName, text: d.data().text, createdAt: d.data().createdAt,
      }))),
      (e) => console.warn("tribe messages:", e.message));
  }, [id, joined]);

  // Hide messages from people you've blocked.
  const shownMessages = useMemo(
    () => messages.filter((m) => !(m.uid && blockedIds?.has(m.uid))),
    [messages, blockedIds]
  );

  const send = async (text) => {
    await addDoc(collection(db, "tribes", id, "messages"), {
      authorId: user.uid,
      authorName: profile?.displayName || user.displayName || "Explorer",
      authorPhotoURL: profile?.photoURL || user.photoURL || "",
      text, createdAt: serverTimestamp(),
    });
  };

  const reportChat = async () => {
    setMenu(false);
    try {
      await reportContent({ targetType: "tribe-chat", targetId: id, targetOwnerId: tribe?.ownerId || null, reason: "harassment" });
      setNotice("Reported. Our team will review this tribe's chat.");
    } catch (e) { setNotice(e.message || "Could not report."); }
  };

  const count = tribe?.memberCount ?? tribe?.members ?? 0;
  const cats = tribe?.categories || (tribe?.category ? [tribe.category] : []);

  return (
    <div className="h-full flex flex-col bg-white">
      <StatusBar />
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-black/5 relative">
        <button onClick={() => nav(-1)} aria-label="Back" className="text-brand-navy text-2xl leading-none">‹</button>
        <h1 className="text-lg font-semibold text-brand-navy truncate flex-1">{tribe?.name || "Tribe"}</h1>
        {joined && (
          <button onClick={() => setMenu((v) => !v)} aria-label="More options" className="text-brand-navy/70 p-1">
            <More className="w-5 h-5" />
          </button>
        )}
        {menu && (
          <div className="absolute right-3 top-12 z-20 bg-white rounded-xl shadow-card border border-black/5 overflow-hidden w-44">
            <button onClick={reportChat} className="w-full text-left px-4 py-3 text-sm font-medium text-ink hover:bg-brand-tint">Report this chat</button>
          </div>
        )}
      </div>

      <div className="px-5 pt-4 pb-4 border-b border-black/5">
        <div className="flex items-center gap-3">
          {tribe?.img ? (
            <img src={tribe.img} alt="" className="w-16 h-16 rounded-2xl object-cover bg-brand-tint shrink-0" />
          ) : (
            <span className="w-16 h-16 rounded-2xl bg-brand-navy text-brand-greenBright grid place-items-center shrink-0">
              <TribesIcon className="w-8 h-8" />
            </span>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-extrabold text-brand-navy leading-tight">{tribe?.name}</h2>
            <p className="text-muted text-[13px]">{count} {count === 1 ? "Member" : "Members"}{tribe?.location ? ` · ${tribe.location}` : ""}</p>
          </div>
          {tribe && <JoinButton joined={joined} onToggle={() => toggleMembership(tribe)} />}
        </div>
        {cats.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {cats.map((c) => (
              <span key={c} className="px-3 py-1 rounded-full bg-brand-tint text-brand-navy text-[12px] font-semibold">
                {CAT_LABELS[c] || c}
              </span>
            ))}
          </div>
        )}
        {tribe?.description && <p className="text-ink/80 text-sm mt-3">{tribe.description}</p>}
      </div>

      {notice && <p className="text-center text-brand-green text-[13px] py-2 px-4 bg-brand-tint">{notice}</p>}

      {joined ? (
        <ChatThread messages={shownMessages} meUid={user?.uid} onSend={send} showNames
          onAuthorClick={(m) => m.uid && nav(`/u/${m.uid}`)} placeholder="Message the tribe…" />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
          <span className="w-16 h-16 rounded-2xl bg-brand-tint text-brand-green grid place-items-center mb-4">
            <TribesIcon className="w-8 h-8" />
          </span>
          <h3 className="font-extrabold text-brand-navy">Join to see the group chat</h3>
          <p className="text-muted text-sm mt-1 mb-4">Members can chat, plan trips, and meet up.</p>
          {tribe && <JoinButton joined={joined} onToggle={() => toggleMembership(tribe)} />}
        </div>
      )}
    </div>
  );
}
