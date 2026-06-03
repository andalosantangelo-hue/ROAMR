import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  collection, addDoc, updateDoc, doc, onSnapshot, query, orderBy, serverTimestamp, increment,
} from "firebase/firestore";
import { db } from "../lib/firebase.js";
import { useAuth } from "../store/AuthContext.jsx";
import StatusBar from "../components/StatusBar.jsx";
import { Send } from "../components/Icons.jsx";
import { initials } from "../lib/util.js";

const fmt = (ts) => {
  if (!ts) return "now";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
};

export default function Comments() {
  const { type, id } = useParams();          // type = "posts" | "activities"
  const nav = useNavigate();
  const { user, profile } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, type, id, "comments"), orderBy("createdAt", "asc"));
    return onSnapshot(q, (snap) => setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (e) => console.warn("comments:", e.message));
  }, [type, id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [comments.length]);

  const send = async (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || !user || busy) return;
    setText(""); setBusy(true);
    try {
      await addDoc(collection(db, type, id, "comments"), {
        authorId: user.uid,
        authorName: profile?.displayName || user.displayName || (user.email ? user.email.split("@")[0] : "Explorer"),
        authorPhotoURL: profile?.photoURL || user.photoURL || null,
        text: t, createdAt: serverTimestamp(),
      });
      // commentCount maintained by Cloud Function
    } catch (err) { console.warn("addComment:", err.message); }
    setBusy(false);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <StatusBar />
      <div className="flex items-center gap-3 px-5 py-3 border-b border-black/5">
        <button onClick={() => nav(-1)} className="text-brand-navy text-2xl leading-none">‹</button>
        <h1 className="text-lg font-semibold text-brand-navy">Comments</h1>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-4">
        {comments.length === 0 ? (
          <div className="text-center text-muted mt-16 px-8">
            <p className="font-semibold text-brand-navy">No comments yet</p>
            <p className="text-sm mt-1">Start the conversation.</p>
          </div>
        ) : comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            {c.authorPhotoURL ? (
              <img src={c.authorPhotoURL} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
            ) : (
              <span className="w-8 h-8 rounded-full bg-brand-tint text-brand-navy grid place-items-center text-[11px] font-semibold shrink-0">{initials(c.authorName)}</span>
            )}
            <div className="flex-1 min-w-0">
              <div className="bg-brand-tint/60 rounded-2xl rounded-tl-sm px-3.5 py-2.5">
                <span className="font-semibold text-ink text-[13px]">{c.authorName}</span>
                <p className="text-ink text-[14px] leading-snug">{c.text}</p>
              </div>
              <span className="text-muted text-[11px] ml-2">{fmt(c.createdAt)}</span>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="flex items-center gap-2 px-4 py-3 border-t border-black/5 pb-6">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a comment…"
          className="flex-1 rounded-full border border-black/10 bg-white px-4 py-3 text-[15px] outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/30 placeholder:text-muted" />
        <button type="submit" disabled={!text.trim() || busy}
          className="w-11 h-11 rounded-full bg-brand-green text-white grid place-items-center disabled:opacity-40 shrink-0">
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
