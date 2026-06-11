import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StatusBar from "../components/StatusBar.jsx";
import { Hiking, Water, Bike, Nature, Snow, Check } from "../components/Icons.jsx";
import { useAuth } from "../store/AuthContext.jsx";
import { track } from "../lib/analytics.js";

const ACTIVITIES = [
  { id: "outdoor", label: "Outdoor Adventures", Icon: Hiking },
  { id: "water", label: "Water Activities", Icon: Water },
  { id: "wheel", label: "Wheel-based Activities", Icon: Bike },
  { id: "nature", label: "Nature & Wildlife Activities", Icon: Nature },
  { id: "snow", label: "Snow Adventures", Icon: Snow },
];

export default function Onboarding() {
  const nav = useNavigate();
  const { user, profile, saveInterests, saveProfile } = useAuth();
  const [name, setName] = useState(profile?.displayName || user?.displayName || "");
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);

  // Pre-fill the name once auth/profile resolves (e.g. Google/Apple sign-ups),
  // without clobbering anything the user has already typed.
  useEffect(() => {
    const existing = profile?.displayName || user?.displayName;
    if (existing) setName((n) => (n ? n : existing));
  }, [profile, user]);

  const toggle = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const canContinue = name.trim().length >= 2 && selected.length > 0;

  const finish = async () => {
    setBusy(true);
    try {
      await saveProfile({ displayName: name.trim() });
      await saveInterests(selected);
    } catch (e) { /* non-blocking */ }
    track("onboarding_complete", { count: selected.length });
    nav("/app/home");
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-brand-tint to-white">
      <StatusBar />
      <div className="flex-1 flex flex-col px-6 overflow-y-auto no-scrollbar">
        <h1 className="text-[26px] font-extrabold text-brand-navy mt-6 mb-1">
          Welcome to ROAMR
        </h1>
        <p className="text-ink/70 text-[15px] mb-5">Let&apos;s set up your profile.</p>

        <label htmlFor="displayName" className="block text-[13px] font-semibold text-ink/70 mb-1 ml-1">Your name</label>
        <input
          id="displayName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          autoComplete="name"
          placeholder="What should we call you?"
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-[15px] outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/30 placeholder:text-muted mb-6"
        />

        <h2 className="text-[18px] font-extrabold text-brand-navy mb-3">
          Activities you like
        </h2>

        <div className="space-y-3">
          {ACTIVITIES.map(({ id, label, Icon }) => {
            const on = selected.includes(id);
            return (
              <button
                key={id}
                onClick={() => toggle(id)}
                className={`w-full flex items-center gap-4 rounded-2xl bg-white px-4 py-3.5 text-left transition
                  border ${on ? "border-brand-green ring-2 ring-brand-green/30" : "border-black/5"} shadow-card`}
              >
                <span className="w-11 h-11 rounded-xl bg-brand-navy text-white grid place-items-center shrink-0">
                  <Icon className="w-6 h-6" />
                </span>
                <span className="flex-1 font-semibold text-ink">{label}</span>
                {on && (
                  <span className="w-6 h-6 rounded-full bg-brand-green text-white grid place-items-center">
                    <Check className="w-4 h-4" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-auto pt-8 pb-7">
          <button
            disabled={!canContinue || busy}
            onClick={finish}
            className={`w-full rounded-xl py-4 font-semibold transition ${
              canContinue
                ? "bg-brand-green hover:bg-brand-greenDark text-white"
                : "bg-black/15 text-white/90 cursor-not-allowed"
            }`}
          >
            Continue
          </button>
          <p className="text-center text-[14px] text-ink/80 mt-4">
            Have another activity in mind?{" "}
            <a href="mailto:hello@roamr.app?subject=ROAMR%20activity%20request" className="text-brand-green font-semibold">Request here</a>
          </p>
        </div>
      </div>
    </div>
  );
}
