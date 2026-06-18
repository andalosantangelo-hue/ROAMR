import { useState } from "react";
import { More } from "./Icons.jsx";
import { useAuth } from "../store/AuthContext.jsx";
import { SAFETY_REPORT_REASONS, SAFETY_RESPONSE_COMMITMENT } from "../lib/safety.js";

export default function CardMenu({ targetType, targetId, ownerId }) {
  const { user, reportContent, blockUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("menu"); // menu | reasons | done
  const isSelf = user && ownerId && user.uid === ownerId;

  const close = () => { setOpen(false); setView("menu"); };
  const report = async (reason) => {
    try { await reportContent({ targetType, targetId, targetOwnerId: ownerId, reason }); } catch { /* ignore */ }
    setView("done"); setTimeout(close, 2600);
  };
  const block = async () => { try { await blockUser(ownerId); } catch { /* ignore */ } close(); };

  if (!ownerId) return null;

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} aria-label="More" className="text-muted"><More className="w-5 h-5" /></button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={close} />
          <div className="absolute right-0 top-7 z-20 w-60 bg-white rounded-xl shadow-lg border border-black/5 overflow-hidden text-sm">
            {view === "menu" && (
              <>
                <button onClick={() => setView("reasons")} className="w-full text-left px-4 py-3 hover:bg-brand-tint">Report</button>
                {!isSelf && <button onClick={block} className="w-full text-left px-4 py-3 hover:bg-brand-tint text-red-600 border-t border-black/5">Block user</button>}
              </>
            )}
            {view === "reasons" && (
              <div className="max-h-72 overflow-y-auto no-scrollbar">
                <p className="px-4 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wide text-brand-navy/55">Why are you reporting?</p>
                {SAFETY_REPORT_REASONS.map((r) => (
                  <button key={r.id} onClick={() => report(r.id)} className="w-full text-left px-4 py-2.5 hover:bg-brand-tint border-t border-black/5">{r.label}</button>
                ))}
              </div>
            )}
            {view === "done" && (
              <div className="px-4 py-3">
                <p className="text-brand-green font-semibold mb-1">Report received ✓</p>
                <p className="text-ink/70 text-[12px] leading-relaxed">{SAFETY_RESPONSE_COMMITMENT}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
