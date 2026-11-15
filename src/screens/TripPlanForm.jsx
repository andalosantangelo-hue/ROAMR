import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext.jsx";
import { useSafety } from "../store/SafetyContext.jsx";
import { GRACE_OPTIONS } from "../lib/safety.js";
import { friendlyError } from "../lib/image.js";
import StatusBar from "../components/StatusBar.jsx";

const inputCls = "w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-[15px] outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/30 placeholder:text-muted";
const Lbl = ({ children }) => <p className="text-sm font-semibold text-ink/80 mb-2 mt-5 first:mt-0">{children}</p>;

export default function TripPlanForm() {
  const nav = useNavigate();
  const { profile } = useAuth();
  const { createTripPlan } = useSafety();
  const ec = profile?.emergencyContact;
  const [objective, setObjective] = useState("");
  const [activity, setActivity] = useState("");
  const [area, setArea] = useState("");
  const [startAt, setStartAt] = useState("");
  const [returnAt, setReturnAt] = useState("");
  const [partners, setPartners] = useState("");
  const [shareMedical, setShareMedical] = useState(false);
  const [graceMins, setGraceMins] = useState(60);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const canSave = objective.trim() && returnAt && !busy;

  const submit = async () => {
    if (!canSave) return;
    const start = startAt ? new Date(startAt) : new Date();
    const back = new Date(returnAt);
    // A return time in the past (or before the start) flipped the trip to "overdue"
    // within 15 minutes of starting it.
    if (!(back.getTime() > Date.now())) { setError("Your expected return time needs to be in the future."); return; }
    if (!(back.getTime() > start.getTime())) { setError("Your expected return needs to be after your start time."); return; }
    setBusy(true); setError("");
    try {
      await createTripPlan({
        objective: objective.trim().slice(0, 200), activity: activity.trim().slice(0, 80), area: area.trim().slice(0, 500),
        startAt: start,
        expectedReturnAt: back,
        // Typed names are a note for the record only. Sharing a plan works by account
        // (partners = user ids), which needs a friend picker — names never granted access.
        partners: [],
        partnerNames: partners.split(/[\n,]/).map((x) => x.trim().slice(0, 60)).filter(Boolean).slice(0, 10),
        emergencyContact: ec ? { name: ec.name || "", phone: ec.phone || "", relation: ec.relation || "" } : null,
        shareMedical, medical: shareMedical ? (profile?.medical || null) : null,
        graceMins,
      });
      nav("/safety/trips");
    } catch (e) { setError(friendlyError(e, "Your trip plan couldn't be saved. Please try again.")); setBusy(false); }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <StatusBar />
      <div className="flex items-center gap-3 px-5 py-3 border-b border-black/5">
        <button onClick={() => nav(-1)} aria-label="Back" className="text-brand-navy text-2xl leading-none">‹</button>
        <h1 className="text-lg font-semibold text-brand-navy">New trip plan</h1>
      </div>
      <div className="flex-1 px-6 pt-4 overflow-y-auto no-scrollbar">
        <Lbl>Objective</Lbl>
        <input value={objective} onChange={(e) => setObjective(e.target.value)} maxLength={200} placeholder="e.g. Summit Mt. Sneffels via SW ridge" className={inputCls} />
        <Lbl>Activity</Lbl>
        <input value={activity} onChange={(e) => setActivity(e.target.value)} placeholder="e.g. Alpine climb" className={inputCls} />
        <Lbl>Area / route / trailhead</Lbl>
        <textarea value={area} onChange={(e) => setArea(e.target.value)} rows={2} maxLength={500} placeholder="Trailhead, route, where you'll park" className={`${inputCls} resize-none`} />
        <Lbl>Start</Lbl>
        <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} className={inputCls} />
        <Lbl>Expected return</Lbl>
        <input type="datetime-local" value={returnAt} onChange={(e) => setReturnAt(e.target.value)} className={inputCls} />
        <Lbl>Who's going (names)</Lbl>
        <textarea value={partners} onChange={(e) => setPartners(e.target.value)} rows={2} placeholder="One per line" className={`${inputCls} resize-none`} />

        <Lbl>Alert my contact if I'm not back within</Lbl>
        <div className="flex flex-wrap gap-2">
          {GRACE_OPTIONS.map((g) => (
            <button key={g.id} onClick={() => setGraceMins(g.id)}
              className={`px-3.5 py-2 rounded-full text-sm font-semibold ${graceMins === g.id ? "bg-brand-green text-white" : "bg-brand-tint text-brand-navy"}`}>{g.label}</button>
          ))}
        </div>

        <div className="rounded-xl bg-brand-tint p-3 mt-5 text-[13px] text-ink/80">
          {ec?.name ? <>Emergency contact: <span className="font-semibold">{ec.name}</span>{ec.phone ? ` · ${ec.phone}` : ""}</>
            : <>No emergency contact set. <button onClick={() => nav("/safety/emergency")} className="text-brand-green font-semibold">Add one</button> so we can alert someone.</>}
        </div>
        <label className="flex items-center gap-3 mt-3">
          <input type="checkbox" checked={shareMedical} onChange={(e) => setShareMedical(e.target.checked)} className="w-5 h-5 accent-[#5A7E2D]" />
          <span className="text-[14px] text-ink/85">Share my medical info on this trip</span>
        </label>
        {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
        <div className="h-4" />
      </div>
      <div className="px-6 pb-7 pt-3 border-t border-black/5">
        <button disabled={!canSave} onClick={submit}
          className={`w-full rounded-xl py-4 font-semibold transition ${canSave ? "bg-brand-green hover:bg-brand-greenDark text-white" : "bg-black/15 text-white/90 cursor-not-allowed"}`}>
          {busy ? "Saving…" : "Save trip plan"}
        </button>
      </div>
    </div>
  );
}
