import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext.jsx";
import { SAFETY_NORMS, WAIVER_VERSION } from "../lib/safety.js";
import StatusBar from "../components/StatusBar.jsx";
import { Check } from "../components/Icons.jsx";

export default function Waiver() {
  const nav = useNavigate();
  const { profile, savePrivate } = useAuth();
  const accepted = !!profile?.waiverAcceptedAt;
  const [busy, setBusy] = useState(false);

  const accept = async () => {
    setBusy(true);
    try { await savePrivate({ waiverAcceptedAt: Date.now(), waiverVersion: WAIVER_VERSION }); nav(-1); }
    finally { setBusy(false); }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <StatusBar />
      <div className="flex items-center gap-3 px-5 py-3 border-b border-black/5">
        <button onClick={() => nav(-1)} aria-label="Back" className="text-brand-navy text-2xl leading-none">‹</button>
        <h1 className="text-lg font-semibold text-brand-navy">Safety norms</h1>
      </div>
      <div className="flex-1 px-6 pt-4 overflow-y-auto no-scrollbar">
        <h2 className="text-xl font-extrabold text-brand-navy">Adventure smart</h2>
        <p className="text-ink/75 text-[15px] mt-1 mb-4">The outdoors carries real risk. ROAMR helps you find partners — staying safe is on all of us.</p>
        <ul className="space-y-3">
          {SAFETY_NORMS.map((n, i) => (
            <li key={i} className="flex gap-3"><span className="w-6 h-6 rounded-full bg-brand-tint text-brand-green grid place-items-center shrink-0"><Check className="w-4 h-4" /></span><span className="text-ink/85 text-[14px] leading-relaxed">{n}</span></li>
          ))}
        </ul>
        <div className="rounded-xl bg-brand-tint p-4 mt-5 text-[13px] text-ink/80 leading-relaxed">
          By using ROAMR to meet and adventure with others, you acknowledge that you participate <span className="font-semibold">at your own risk</span>, that ROAMR does not vet, supervise, or guarantee any member or activity, and that you are responsible for your own safety decisions.
        </div>
        {accepted && <p className="text-brand-green text-sm font-semibold mt-4 text-center">You accepted these on {new Date(profile.waiverAcceptedAt).toLocaleDateString()}.</p>}
        <div className="h-4" />
      </div>
      <div className="px-6 pb-7 pt-3 border-t border-black/5">
        <button disabled={busy} onClick={accept} className="w-full rounded-xl bg-brand-green hover:bg-brand-greenDark text-white font-semibold py-4 disabled:opacity-60">
          {accepted ? "I acknowledge again" : busy ? "Saving…" : "I understand & accept"}
        </button>
      </div>
    </div>
  );
}
