import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase.js";
import { useSafety } from "../store/SafetyContext.jsx";
import { REVIEW_DIMS } from "../lib/safety.js";
import StatusBar from "../components/StatusBar.jsx";
import { Star } from "../components/Icons.jsx";

function Stars({ value, onChange }) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onChange(n)} aria-label={`${n} stars`}>
          <Star className={`w-7 h-7 ${n <= value ? "text-brand-green" : "text-black/15"}`} />
        </button>
      ))}
    </div>
  );
}

export default function LeaveReview() {
  const { uid } = useParams();
  const nav = useNavigate();
  const { leaveReview } = useSafety();
  const [name, setName] = useState("this partner");
  const [ratings, setRatings] = useState({});
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getDoc(doc(db, "users", uid)).then((s) => { if (s.exists()) setName(s.data().displayName || "this partner"); }).catch(() => {});
  }, [uid]);

  const set = (k, v) => setRatings((r) => ({ ...r, [k]: v }));
  const canSave = REVIEW_DIMS.every((d) => ratings[d.key]) && !busy;

  const submit = async () => {
    if (!canSave) return;
    setBusy(true);
    try { await leaveReview(uid, ratings, text); nav(`/u/${uid}`); }
    catch { setBusy(false); }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <StatusBar />
      <div className="flex items-center gap-3 px-5 py-3 border-b border-black/5">
        <button onClick={() => nav(-1)} aria-label="Back" className="text-brand-navy text-2xl leading-none">‹</button>
        <h1 className="text-lg font-semibold text-brand-navy truncate">Review {name}</h1>
      </div>
      <div className="flex-1 px-6 pt-4 overflow-y-auto no-scrollbar">
        <p className="text-ink/75 text-[15px] mb-4">How was adventuring with {name}? Honest reviews keep the community safe.</p>
        {REVIEW_DIMS.map((d) => (
          <div key={d.key} className="flex items-center justify-between py-3 border-b border-black/5">
            <span className="font-semibold text-ink text-[15px]">{d.label}</span>
            <Stars value={ratings[d.key] || 0} onChange={(v) => set(d.key, v)} />
          </div>
        ))}
        <p className="text-sm font-semibold text-ink/80 mb-2 mt-5">Add a note (optional)</p>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={1000} placeholder="What should others know?"
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[15px] outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/30 placeholder:text-muted resize-none" />
        <div className="h-4" />
      </div>
      <div className="px-6 pb-7 pt-3 border-t border-black/5">
        <button disabled={!canSave} onClick={submit}
          className={`w-full rounded-xl py-4 font-semibold transition ${canSave ? "bg-brand-green hover:bg-brand-greenDark text-white" : "bg-black/15 text-white/90 cursor-not-allowed"}`}>
          {busy ? "Submitting…" : "Submit review"}
        </button>
      </div>
    </div>
  );
}
