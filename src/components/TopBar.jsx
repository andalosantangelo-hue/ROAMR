import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "./Logo.jsx";
import { Bell } from "./Icons.jsx";
import { useAuth } from "../store/AuthContext.jsx";
import { useFeedScope } from "../store/FeedScopeContext.jsx";
import { SCOPES } from "../lib/feed.js";

function Chevron({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export default function TopBar() {
  const nav = useNavigate();
  const { unreadCount } = useAuth();
  const { scope, setScope } = useFeedScope();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = SCOPES.find((s) => s.id === scope) || SCOPES[0];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="bg-gradient-to-b from-brand-tint to-white px-4 pt-1 pb-3 flex items-center justify-between">
      <Logo size={34} showWord={false} />
      <div className="flex items-center gap-2">
        <div className="relative" ref={ref}>
          <button onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}
            aria-label={`Feed: ${current.label}. Change feed`}
            className="flex items-center gap-1.5 bg-white rounded-full pl-4 pr-3 py-2 text-sm font-semibold text-brand-navy shadow-card">
            {current.label}
            <Chevron className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
          {open && (
            <div role="menu" className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-card ring-1 ring-black/5 p-1.5 z-30">
              {SCOPES.map((s) => {
                const on = s.id === scope;
                return (
                  <button key={s.id} role="menuitemradio" aria-checked={on}
                    onClick={() => { setScope(s.id); setOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-start gap-2.5 ${on ? "bg-brand-tint" : "hover:bg-gray-50"}`}>
                    <span className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${on ? "bg-brand-green" : "ring-1 ring-gray-300"}`} />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-brand-navy">{s.label}</span>
                      <span className="block text-xs text-muted">{s.blurb}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <button onClick={() => nav("/notifications")} aria-label="Notifications" className="relative w-10 h-10 rounded-full bg-white shadow-card grid place-items-center text-brand-navy">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-green text-white text-[10px] font-bold grid place-items-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
