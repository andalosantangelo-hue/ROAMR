import { useState } from "react";
import { useNavigate } from "react-router-dom";
import StatusBar from "../components/StatusBar.jsx";
import { ChevronDown } from "../components/Icons.jsx";

const GUIDES = [
  { t: "Getting Started on ROAMR", d: "Set up your profile, pick the activities you love, and follow a few explorers so your feed comes alive. Your home feed shows trips from people and tribes you follow." },
  { t: "Creating an Activity", d: "Tap + on the Activities tab. Add a clear title, a location, a date and time, and the skill level so the right people can join. You'll get notified when someone joins." },
  { t: "Finding & Joining Tribes", d: "Tribes are groups around a shared interest or place. Browse the Tribes tab, open one to see its members and activities, and tap Join. Use the group chat to plan trips." },
  { t: "Selling & Buying Gear", d: "List gear in the Marketplace with a category, price, and photos so buyers can find it fast. Browse the ROAMR Apparel tab for official gear." },
  { t: "Staying Safe Outdoors", d: "Meet new people in public places first, share your plans with a friend, check the weather and trail conditions, and know your limits. Report anything that feels off." },
];

export default function Guides() {
  const nav = useNavigate();
  const [open, setOpen] = useState(0);
  return (
    <div className="h-full flex flex-col bg-white">
      <StatusBar />
      <div className="flex items-center gap-3 px-5 py-3">
        <button onClick={() => nav(-1)} aria-label="Back" className="text-brand-navy text-2xl leading-none">‹</button>
        <h1 className="text-lg font-semibold text-brand-navy">Guides</h1>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pt-3 pb-8">
        <div className="divide-y divide-black/5">
          {GUIDES.map((g, i) => (
            <div key={i} className="py-1">
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center gap-3 py-3 text-left">
                <span className="flex-1 font-semibold text-ink text-[15px]">{g.t}</span>
                <ChevronDown className={`w-5 h-5 text-muted transition-transform ${open === i ? "rotate-180" : ""}`} />
              </button>
              {open === i && <p className="text-ink/75 text-[14px] leading-relaxed pb-3">{g.d}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
