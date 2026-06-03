import { useState } from "react";
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
  const { saveInterests } = useAuth();
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);

  const toggle = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const canContinue = selected.length > 0;

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-brand-tint to-white">
      <StatusBar />
      <div className="flex-1 flex flex-col px-6 overflow-y-auto no-scrollbar">
        <h1 className="text-[26px] font-extrabold text-brand-navy mt-6 mb-6">
          Start with activities you like
        </h1>

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
            onClick={async () => { setBusy(true); try { await saveInterests(selected); } catch (e) {} track("onboarding_complete", { count: selected.length }); nav("/app/home"); }}
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
            <span className="text-brand-green font-semibold">Request here</span>
          </p>
        </div>
      </div>
    </div>
  );
}
