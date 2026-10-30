import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  collection, addDoc, onSnapshot, query, orderBy, limitToLast, serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase.js";
import { useAuth } from "../store/AuthContext.jsx";
import StatusBar from "../components/StatusBar.jsx";
import { Send } from "../components/Icons.jsx";
import { initials } from "../lib/util.js";
import { SkeletonRegion, ListRowSkeleton } from "../components/skeletons";

const fmt = (ts) => {
  if (!ts) return "now";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
};

export default function Comments() {
  const { type, id } = useParams();          // type = "posts" | "activities"
  const nav = useNavigate();
  const { user, profile, blockedIds } = useAuth();
  const [comments, setComments] = useState(null); // null until the first snapshot (skeleton)
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);

  // Newest 100 only — an unbounded listener re-read every comment on every open.
  useEffect(() => {
    const q = query(collection(db, type, id, "comments"), orderBy("createdAt", "asc"), limitToLast(100));
    return onSnapshot(q, (snap) => setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (e) => { console.warn("comments:", e.message); setComments([]); });
  }, [type, id]);
  const visible = (comments || []).filter((c) => !blockedIds?.has(c.authorId));

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [comments?.length]);

  const send = async (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || !user || busy) return;
    setBusy(true); setError("");
    try {
      await addDoc(collection(db, type, id, "comments"), {
        authorId: user.uid,
        authorName: (profile?.displayName || user.displayName || (user.email ? user.email.split("@")[0] : "Explorer")).slice(0, 40),
        authorPhotoURL: profile?.photoURL || user.photoURL || null,
        text: t, createdAt: serverTimestamp(),
      });
      setText(""); // only clear once it's saved — a failed send used to lose the text
      // commentCount maintained by Cloud Function
    } catch {
      setError("Your comment didn't send. Check your connection and try again.");
    }
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
        {comments === null ? (
          <SkeletonRegion label="Loading comments" className="space-y-4">
            {[0, 1, 2].map((i) => <ListRowSkeleton key={i} variant="comment" />)}
          </SkeletonRegion>
        ) : visible.length === 0 ? (
          <div className="text-center text-muted mt-16 px-8">
            <p className="font-semibold text-brand-navy">No comments yet</p>
            <p className="text-sm mt-1">Start the conversation.</p>
          </div>
        ) : visible.map((c) => (
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

      {error && <p role="alert" className="text-red-600 text-sm px-4 pt-2">{error}</p>}
      <form onSubmit={send} className="flex items-center gap-2 px-4 py-3 border-t border-black/5 pb-6">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a comment…" maxLength={2000}
          className="flex-1 rounded-full border border-black/10 bg-white px-4 py-3 text-[15px] outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/30 placeholder:text-muted" />
        <button type="submit" disabled={!text.trim() || busy}
          className="w-11 h-11 rounded-full bg-brand-green text-white grid place-items-center disabled:opacity-40 shrink-0">
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
