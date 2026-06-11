import JoinButton from "./JoinButton.jsx";
import { Tribes as TribesIcon, Send } from "./Icons.jsx";
import { shareInvite } from "../lib/share.js";
import { useTribes } from "../store/TribesContext.jsx";

export default function TribeCard({ tribe }) {
  const { joinedIds, toggleMembership } = useTribes();
  const joined = joinedIds.has(tribe.id);
  const count = tribe.memberCount ?? tribe.members ?? 0;

  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl shadow-card p-3">
      {tribe.img ? (
        <img src={tribe.img} alt="" className="w-14 h-14 rounded-xl object-cover bg-brand-tint shrink-0" />
      ) : (
        <span className="w-14 h-14 rounded-xl bg-brand-navy text-brand-greenBright grid place-items-center shrink-0">
          <TribesIcon className="w-7 h-7" />
        </span>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-ink leading-tight truncate">{tribe.name}</h3>
        <p className="text-muted text-[13px] mt-0.5">{count} {count === 1 ? "Member" : "Members"}</p>
      </div>
      <button onClick={() => shareInvite({ title: `Join ${tribe.name} on ROAMR`, text: "", type: "tribe", id: tribe.id })}
        className="w-9 h-9 grid place-items-center text-brand-navy/70 shrink-0" aria-label="Invite"><Send className="w-5 h-5" /></button>
      <JoinButton joined={joined} onToggle={() => toggleMembership(tribe)} />
    </div>
  );
}
