import { useNavigate } from "react-router-dom";
import StatusBar from "../components/StatusBar.jsx";
import Logo from "../components/Logo.jsx";
import { ChevronRight, Info } from "../components/Icons.jsx";

const LINKS = [
  { title: "Terms of Service", url: "https://roamr.app/terms" },
  { title: "Privacy Policy", url: "https://roamr.app/privacy" },
  { title: "Accessibility", url: "https://roamr.app/accessibility" },
];

export default function About() {
  const nav = useNavigate();
  return (
    <div className="h-full flex flex-col bg-white">
      <StatusBar />
      <div className="flex items-center gap-3 px-5 py-3">
        <button onClick={() => nav(-1)} aria-label="Back" className="text-brand-navy text-2xl leading-none">‹</button>
        <h1 className="text-lg font-semibold text-brand-navy">About</h1>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pt-4 pb-8">
        <div className="flex flex-col items-center text-center mb-6">
          <Logo size={64} showWord={false} />
          <div className="mt-3 text-2xl font-extrabold tracking-tight text-brand-navy">ROAMR</div>
          <p className="text-muted text-[13px] mt-1">Version 1.0.0</p>
        </div>

        <p className="text-ink/80 text-[15px] leading-relaxed mb-6">
          ROAMR helps you find your tribe and get outside. Discover activities near you,
          join tribes of fellow adventurers, share your trips, and trade gear — all in one place.
        </p>

        <h2 className="text-sm font-bold text-ink/60 uppercase tracking-wide mb-2">Legal</h2>
        <div className="divide-y divide-black/5">
          {LINKS.map(({ title, url }) => (
            <a key={title} href={url} target="_blank" rel="noreferrer"
              className="flex items-center gap-3 py-3.5">
              <Info className="w-5 h-5 text-brand-navy" />
              <span className="flex-1 font-semibold text-ink">{title}</span>
              <ChevronRight className="w-5 h-5 text-muted" />
            </a>
          ))}
        </div>

        <p className="text-center text-muted text-[13px] mt-8">© 2026 ROAMR. Made for the outdoors.</p>
      </div>
    </div>
  );
}
