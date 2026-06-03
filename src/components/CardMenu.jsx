import { useState } from "react";
import { More } from "./Icons.jsx";
import { useAuth } from "../store/AuthContext.jsx";

export default function CardMenu({ targetType, targetId, ownerId }) {
  const { user, reportContent, blockUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState("");
  const isSelf = user && ownerId && user.uid === ownerId;

  const report = async () => {
    try { await reportContent({ targetType, targetId, targetOwnerId: ownerId }); } catch {}
    setDone("Reported"); setTimeout(() => { setOpen(false); setDone(""); }, 1000);
  };
  const block = async () => { try { await blockUser(ownerId); } catch {} setOpen(false); };

  if (!ownerId) return null; // demo/seed cards have no real author to report/block

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="text-muted"><More className="w-5 h-5" /></button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-7 z-20 w-44 bg-white rounded-xl shadow-lg border border-black/5 overflow-hidden text-sm">
            {done ? (
              <div className="px-4 py-3 text-brand-green font-medium">{done} ✓</div>
            ) : (
              <>
                <button onClick={report} className="w-full text-left px-4 py-3 hover:bg-brand-tint">Report</button>
                {!isSelf && ownerId && (
                  <button onClick={block} className="w-full text-left px-4 py-3 hover:bg-brand-tint text-red-600 border-t border-black/5">Block user</button>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
