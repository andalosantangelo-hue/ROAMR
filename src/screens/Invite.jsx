import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase.js";
import StatusBar from "../components/StatusBar.jsx";
import Logo from "../components/Logo.jsx";
import { useTribes } from "../store/TribesContext.jsx";
import { useActivities } from "../store/ActivitiesContext.jsx";

const COLL = { tribe: "tribes", activity: "activities", post: "posts" };

export default function Invite() {
  const { type, id } = useParams();
  const nav = useNavigate();
  const { joinedIds: tribeJoined, toggleMembership } = useTribes();
  const { joinedIds: actJoined, toggleAttend } = useActivities();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const coll = COLL[type];
    if (!coll) { setLoading(false); return; }
    getDoc(doc(db, coll, id))
      .then((s) => setItem(s.exists() ? { id: s.id, ...s.data() } : null))
      .finally(() => setLoading(false));
  }, [type, id]);

  const accept = async () => {
    setBusy(true);
    try {
      if (type === "tribe") { if (!tribeJoined.has(id)) await toggleMembership(item); nav("/app/tribes"); }
      else if (type === "activity") { if (!actJoined.has(id)) await toggleAttend(item); nav("/app/activities"); }
      else nav("/app/home");
    } catch { setBusy(false); }
  };

  const title = type === "tribe" ? item?.name
    : type === "activity" ? item?.text
    : item?.title;
  const cta = type === "tribe" ? "Join tribe"
    : type === "activity" ? "Join activity"
    : "Open in ROAMR";

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-brand-tint to-white">
      <StatusBar />
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <Logo size={60} showWord={false} className="mb-4" />
        {loading ? (
          <p className="text-muted">Loading invite…</p>
        ) : !item ? (
          <>
            <h1 className="text-xl font-extrabold text-brand-navy mb-1">Invite not found</h1>
            <p className="text-muted text-sm mb-6">This link may have expired.</p>
            <button onClick={() => nav("/app/home")} className="rounded-xl bg-brand-green text-white font-semibold px-8 py-3">Open ROAMR</button>
          </>
        ) : (
          <>
            <p className="text-brand-green font-semibold text-sm mb-1">You&apos;re invited</p>
            <h1 className="text-2xl font-extrabold text-brand-navy mb-2 leading-tight">{title}</h1>
            <p className="text-muted text-sm mb-7">
              {type === "tribe" ? "Join this tribe and get outside together." : type === "activity" ? "Join this adventure on ROAMR." : "See this on ROAMR."}
            </p>
            <button disabled={busy} onClick={accept}
              className="w-full max-w-xs rounded-xl bg-brand-green hover:bg-brand-greenDark transition text-white font-semibold py-4 disabled:opacity-60">
              {busy ? "…" : cta}
            </button>
            <button onClick={() => nav("/app/home")} className="mt-3 text-muted text-sm font-medium">Not now</button>
          </>
        )}
      </div>
    </div>
  );
}
