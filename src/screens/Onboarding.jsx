import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StatusBar from "../components/StatusBar.jsx";
import { Hiking, Water, Bike, Nature, Snow, Check } from "../components/Icons.jsx";
import { useAuth } from "../store/AuthContext.jsx";
import { track } from "../lib/analytics.js";
import { titleCase } from "../lib/util.js";

const ACTIVITIES = [
  { id: "outdoor", label: "Outdoor Adventures", Icon: Hiking, subs: ["Hiking", "Backpacking", "Climbing", "Camping", "Trail Running"] },
  { id: "water", label: "Water Activities", Icon: Water, subs: ["Kayaking", "Surfing", "Paddleboarding", "Diving", "Sailing"] },
  { id: "wheel", label: "Wheel-based Activities", Icon: Bike, subs: ["Mountain Biking", "Road Cycling", "Gravel", "Skateboarding"] },
  { id: "nature", label: "Nature & Wildlife", Icon: Nature, subs: ["Birding", "Photography", "Foraging", "Stargazing"] },
  { id: "snow", label: "Snow Adventures", Icon: Snow, subs: ["Skiing", "Snowboarding", "Snowshoeing", "Ski Touring"] },
];
const LEVELS = ["Beginner", "Intermediate", "Advanced"];

export default function Onboarding() {
  const nav = useNavigate();
  const { user, profile, saveInterests, saveProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [name, setName] = useState(profile?.displayName || user?.displayName || "");
  const [selected, setSelected] = useState([]);
  const [subs, setSubs] = useState([]);
  const [levels, setLevels] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const existing = profile?.displayName || user?.displayName;
    if (existing) setName((n) => (n ? n : existing));
  }, [profile, user]);

  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const toggleSub = (label) => setSubs((s) => (s.includes(label) ? s.filter((x) => x !== label) : [...s, label]));
  const setLevel = (id, lvl) => setLevels((m) => ({ ...m, [id]: lvl }));

  const canStep1 = name.trim().length >= 2 && selected.length > 0;
  const picked = ACTIVITIES.filter((a) => selected.includes(a.id));

  const goStep2 = () => {
    // default each selected activity to Beginner
    setLevels((m) => { const next = { ...m }; selected.forEach((id) => { if (!next[id]) next[id] = "Beginner"; }); return next; });
    setStep(2);
  };

  const finish = async () => {
    setBusy(true);
    try {
      const skillLevels = {};
      selected.forEach((id) => { skillLevels[id] = levels[id] || "Beginner"; });
      await saveProfile({ displayName: titleCase(name), subInterests: subs, skillLevels });
      await saveInterests(selected);
    } catch { /* non-blocking */ }
    track("onboarding_complete", { count: selected.length });
    nav("/app/home");
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-brand-tint to-white">
      <StatusBar />
      <div className="flex-1 flex flex-col px-6 overflow-y-auto no-scrollbar">
        {step === 1 ? (
          <>
            <h1 className="text-[26px] font-extrabold text-brand-navy mt-6 mb-1">Welcome to ROAMR</h1>
            <p className="text-ink/70 text-[15px] mb-5">Let&apos;s set up your profile.</p>

            <label htmlFor="displayName" className="block text-[13px] font-semibold text-ink/70 mb-1 ml-1">Your Name</label>
            <input id="displayName" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoComplete="name"
              placeholder="What should we call you?"
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-[15px] outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/30 placeholder:text-muted mb-6" />

            <h2 className="text-[18px] font-extrabold text-brand-navy mb-3">Activities You Like</h2>
            <div className="space-y-3">
              {ACTIVITIES.map(({ id, label, Icon }) => {
                const on = selected.includes(id);
                return (
                  <button key={id} onClick={() => toggle(id)}
                    className={`w-full flex items-center gap-4 rounded-2xl bg-white px-4 py-3.5 text-left transition border ${on ? "border-brand-green ring-2 ring-brand-green/30" : "border-black/5"} shadow-card`}>
                    <span className="w-11 h-11 rounded-xl bg-brand-navy text-white grid place-items-center shrink-0"><Icon className="w-6 h-6" /></span>
                    <span className="flex-1 font-semibold text-ink">{label}</span>
                    {on && <span className="w-6 h-6 rounded-full bg-brand-green text-white grid place-items-center"><Check className="w-4 h-4" /></span>}
                  </button>
                );
              })}
            </div>

            <div className="mt-auto pt-8 pb-7">
              <button disabled={!canStep1} onClick={goStep2}
                className={`w-full rounded-xl py-4 font-semibold transition ${canStep1 ? "bg-brand-green hover:bg-brand-greenDark text-white" : "bg-black/15 text-white/90 cursor-not-allowed"}`}>
                Continue
              </button>
              <p className="text-center text-[14px] text-ink/80 mt-4">
                Have another activity in mind?{" "}
                <a href="mailto:hello@roamr.app?subject=ROAMR%20activity%20request" className="text-brand-green font-semibold">Request here</a>
              </p>
            </div>
          </>
        ) : (
          <>
            <button onClick={() => setStep(1)} className="self-start mt-5 mb-1 text-brand-navy text-2xl leading-none" aria-label="Back">‹</button>
            <h1 className="text-[24px] font-extrabold text-brand-navy mb-1">Tell us your level</h1>
            <p className="text-ink/70 text-[15px] mb-5">Pick what you're into and how experienced you are. This helps us match you with the right people.</p>

            <div className="space-y-5">
              {picked.map(({ id, label, subs: options }) => (
                <div key={id} className="rounded-2xl bg-white border border-black/5 shadow-card p-4">
                  <p className="font-extrabold text-brand-navy mb-2">{label}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {options.map((o) => (
                      <button key={o} onClick={() => toggleSub(o)}
                        className={`px-3 py-1.5 rounded-full text-[13px] font-semibold transition ${subs.includes(o) ? "bg-brand-green text-white" : "bg-brand-tint text-brand-navy"}`}>
                        {o}
                      </button>
                    ))}
                  </div>
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-brand-navy/55 mb-1.5">Skill level</p>
                  <div className="flex rounded-xl border border-black/10 overflow-hidden">
                    {LEVELS.map((lvl) => (
                      <button key={lvl} onClick={() => setLevel(id, lvl)}
                        className={`flex-1 py-2.5 text-[13px] font-semibold transition ${(levels[id] || "Beginner") === lvl ? "bg-brand-green text-white" : "bg-white text-ink"}`}>
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-8 pb-7">
              <button disabled={busy} onClick={finish}
                className="w-full rounded-xl py-4 font-semibold bg-brand-green hover:bg-brand-greenDark text-white transition disabled:opacity-60">
                {busy ? "Setting up…" : "Finish"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
