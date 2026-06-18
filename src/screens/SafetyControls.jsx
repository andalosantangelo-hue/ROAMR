import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext.jsx";
import { WHO_CAN_MESSAGE, GENDERS } from "../lib/safety.js";
import StatusBar from "../components/StatusBar.jsx";

const Lbl = ({ children, hint }) => (
  <div className="mt-6 mb-2 first:mt-0">
    <p className="text-sm font-semibold text-ink/80">{children}</p>
    {hint && <p className="text-muted text-[12px] mt-0.5">{hint}</p>}
  </div>
);
function Toggle({ on, onChange, label }) {
  return (
    <button onClick={() => onChange(!on)} role="switch" aria-checked={on} aria-label={label} className={`w-12 h-7 rounded-full transition relative ${on ? "bg-brand-green" : "bg-black/15"}`}>
      <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

export default function SafetyControls() {
  const nav = useNavigate();
  const { profile, saveProfile } = useAuth();
  const [whoCanMessage, setWho] = useState(profile?.whoCanMessage || "everyone");
  const [verifiedOnly, setVerifiedOnly] = useState(!!profile?.verifiedOnly);
  const [womenOnly, setWomenOnly] = useState(!!profile?.womenOnly);
  const [gender, setGender] = useState(profile?.gender || "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setBusy(true);
    try { await saveProfile({ whoCanMessage, verifiedOnly, womenOnly, gender }); setSaved(true); setTimeout(() => nav(-1), 600); }
    finally { setBusy(false); }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <StatusBar />
      <div className="flex items-center gap-3 px-5 py-3 border-b border-black/5">
        <button onClick={() => nav(-1)} aria-label="Back" className="text-brand-navy text-2xl leading-none">‹</button>
        <h1 className="text-lg font-semibold text-brand-navy">Safety controls</h1>
      </div>
      <div className="flex-1 px-6 pt-4 overflow-y-auto no-scrollbar">
        <Lbl hint="Limit who can start a conversation with you.">Who can message me</Lbl>
        <div className="flex flex-wrap gap-2">
          {WHO_CAN_MESSAGE.map((o) => (
            <button key={o.id} onClick={() => setWho(o.id)}
              className={`px-3.5 py-2 rounded-full text-sm font-semibold ${whoCanMessage === o.id ? "bg-brand-green text-white" : "bg-brand-tint text-brand-navy"}`}>{o.label}</button>
          ))}
        </div>

        <div className="flex items-center justify-between mt-7">
          <div className="flex-1 pr-4">
            <p className="font-semibold text-ink">Verified members only</p>
            <p className="text-muted text-[12px]">Only show me to, and let me see, verified members.</p>
          </div>
          <Toggle on={verifiedOnly} onChange={setVerifiedOnly} label="Verified members only" />
        </div>

        <div className="flex items-center justify-between mt-6">
          <div className="flex-1 pr-4">
            <p className="font-semibold text-ink">Women-only mode</p>
            <p className="text-muted text-[12px]">Prefer connecting with women. Requires setting your gender below.</p>
          </div>
          <Toggle on={womenOnly} onChange={setWomenOnly} label="Women-only mode" />
        </div>

        <Lbl hint="Used only for women-only matching and filters. Optional.">Gender</Lbl>
        <div className="flex flex-wrap gap-2">
          {GENDERS.map((g) => (
            <button key={g.id} onClick={() => setGender(gender === g.id ? "" : g.id)}
              className={`px-3.5 py-2 rounded-full text-sm font-semibold ${gender === g.id ? "bg-brand-green text-white" : "bg-brand-tint text-brand-navy"}`}>{g.label}</button>
          ))}
        </div>
        <div className="h-4" />
      </div>
      <div className="px-6 pb-7 pt-3 border-t border-black/5">
        <button disabled={busy} onClick={save} className="w-full rounded-xl bg-brand-green hover:bg-brand-greenDark text-white font-semibold py-4 disabled:opacity-60">
          {saved ? "Saved ✓" : busy ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
