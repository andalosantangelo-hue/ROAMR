import { useState } from "react";
import { useNavigate } from "react-router-dom";
import StatusBar from "../components/StatusBar.jsx";
import { ChevronRight, ChevronDown, Help, Info, Comment } from "../components/Icons.jsx";

const FAQS = [
  { q: "How do I create an activity?", a: "Go to the Activities tab and tap the + button. Add a title, location, date/time, and skill level, then post it for others to join." },
  { q: "How do I join a tribe?", a: "Open the Tribes tab, find a tribe you like, and tap Join. You can leave a tribe at any time, and members get a group chat to plan trips." },
  { q: "How do I message someone?", a: "Open their profile and tap Message to start a private chat. All your conversations live under Profile → Messages." },
  { q: "How do I edit my profile?", a: "Go to Profile → Edit Profile to change your name, photo, and bio." },
  { q: "How do I report someone?", a: "Tap the ⋯ menu on any post or profile and choose Report. Our team reviews every report." },
  { q: "How do I delete my account?", a: "Go to Profile → Account Settings → Delete Account. This permanently removes your data." },
];

export default function HelpCenter() {
  const nav = useNavigate();
  const [open, setOpen] = useState(null);

  return (
    <div className="h-full flex flex-col bg-white">
      <StatusBar />
      <div className="flex items-center gap-3 px-5 py-3">
        <button onClick={() => nav(-1)} aria-label="Back" className="text-brand-navy text-2xl leading-none">‹</button>
        <h1 className="text-lg font-semibold text-brand-navy">Help Center</h1>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pt-3 pb-8">
        <button onClick={() => nav("/help/bot")}
          className="w-full flex items-center gap-3 rounded-2xl bg-brand-navy text-white p-4 mb-3 text-left">
          <Comment className="w-6 h-6 text-brand-greenBright shrink-0" />
          <div className="flex-1">
            <div className="font-semibold">Ask the ROAMR Assistant</div>
            <div className="text-white/75 text-[13px]">Get instant answers about using the app</div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/60" />
        </button>

        <button onClick={() => nav("/guides")}
          className="w-full flex items-center gap-3 rounded-2xl bg-brand-tint p-4 mb-3 text-left">
          <Help className="w-6 h-6 text-brand-navy shrink-0" />
          <div className="flex-1">
            <div className="font-semibold text-brand-navy">Guides</div>
            <div className="text-ink/70 text-[13px]">How-to guides and getting-started tips</div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted" />
        </button>

        <a href="mailto:support@roamr.app?subject=ROAMR%20Support"
          className="w-full flex items-center gap-3 rounded-2xl border border-black/10 p-4 mb-6 text-left">
          <Info className="w-6 h-6 text-brand-navy shrink-0" />
          <div className="flex-1">
            <div className="font-semibold text-brand-navy">Contact Support</div>
            <div className="text-ink/70 text-[13px]">support@roamr.app — we reply within a day</div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted" />
        </a>

        <h2 className="text-sm font-bold text-ink/60 uppercase tracking-wide mb-2">Frequently Asked</h2>
        <div className="divide-y divide-black/5">
          {FAQS.map((f, i) => (
            <div key={i} className="py-1">
              <button onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center gap-3 py-3 text-left">
                <span className="flex-1 font-semibold text-ink text-[15px]">{f.q}</span>
                <ChevronDown className={`w-5 h-5 text-muted transition-transform ${open === i ? "rotate-180" : ""}`} />
              </button>
              {open === i && <p className="text-ink/75 text-[14px] leading-relaxed pb-3 pr-7">{f.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
