import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext.jsx";
import { useSafety } from "../store/SafetyContext.jsx";
import StatusBar from "../components/StatusBar.jsx";
import { Check, Phone, Info, Gear, ChevronRight, Star } from "../components/Icons.jsx";

const Card = ({ icon: Icon, title, sub, onClick, danger, badge }) => (
  <button onClick={onClick} className="w-full flex items-center gap-3 rounded-2xl bg-white shadow-card p-4 text-left">
    <span className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${danger ? "bg-red-50 text-red-600" : "bg-brand-tint text-brand-green"}`}>
      <Icon className="w-5 h-5" />
    </span>
    <span className="flex-1 min-w-0">
      <span className="block font-semibold text-brand-navy">{title}</span>
      <span className="block text-muted text-[13px] truncate">{sub}</span>
    </span>
    {badge}
    <ChevronRight className="w-5 h-5 text-muted shrink-0" />
  </button>
);

export default function SafetyCenter() {
  const nav = useNavigate();
  const { profile } = useAuth();
  const { activeTrip } = useSafety();
  const verified = !!profile?.verified;

  return (
    <div className="h-full flex flex-col bg-brand-tint/40">
      <StatusBar />
      <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-black/5">
        <button onClick={() => nav(-1)} aria-label="Back" className="text-brand-navy text-2xl leading-none">‹</button>
        <h1 className="text-lg font-semibold text-brand-navy">Safety Center</h1>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-3 space-y-3">
        {activeTrip && (
          <button onClick={() => nav("/safety/trips")}
            className={`w-full rounded-2xl p-4 text-left ${activeTrip.status === "overdue" ? "bg-red-600 text-white" : "bg-brand-green text-white"}`}>
            <p className="font-bold">{activeTrip.status === "overdue" ? "You're overdue — check in now" : "Trip in progress"}</p>
            <p className="text-white/85 text-[13px] mt-0.5">{activeTrip.objective || "Tap to check in safe"}</p>
          </button>
        )}

        <div className="rounded-2xl bg-brand-navy text-white p-4">
          <div className="flex items-center gap-2">
            <span className={`w-7 h-7 rounded-full grid place-items-center ${verified ? "bg-brand-greenBright text-brand-navy" : "bg-white/20 text-white"}`}><Check className="w-4 h-4" /></span>
            <p className="font-bold">{verified ? "You're verified" : "Get verified"}</p>
          </div>
          <p className="text-white/80 text-[13px] mt-2">{verified ? "Your profile shows a verified badge so partners know you're real." : "A quick selfie check earns a verified badge — the #1 trust signal on ROAMR."}</p>
          {!verified && <button onClick={() => nav("/safety/verify")} className="mt-3 rounded-xl bg-brand-greenBright text-brand-navy font-semibold px-4 py-2 text-sm">Start verification</button>}
        </div>

        <Card icon={Info} title="Trip plans & check-in" sub="Share a plan, check in safe, auto-alert" onClick={() => nav("/safety/trips")} />
        <Card icon={Phone} title="Emergency contact & medical" sub="Private — shareable per trip" onClick={() => nav("/safety/emergency")} />
        <Card icon={Gear} title="Safety controls" sub="Verified-only, women-only, who can message" onClick={() => nav("/safety/controls")} />
        <Card icon={Star} title="Safety norms & waiver" sub={profile?.waiverAcceptedAt ? "Accepted — review anytime" : "Read & acknowledge"} onClick={() => nav("/safety/waiver")} />

        <p className="text-muted text-[12px] text-center px-6 pt-2">In an emergency, always call your local emergency number first. ROAMR connects people but isn't on the trail with you.</p>
      </div>
    </div>
  );
}
