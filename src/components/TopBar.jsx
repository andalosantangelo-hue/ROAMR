import { useNavigate } from "react-router-dom";
import Logo from "./Logo.jsx";
import { Bell, ChevronDown } from "./Icons.jsx";
import { useAuth } from "../store/AuthContext.jsx";

export default function TopBar({ scope = "Community" }) {
  const nav = useNavigate();
  const { unreadCount } = useAuth();
  return (
    <div className="bg-gradient-to-b from-brand-tint to-white px-4 pt-1 pb-3 flex items-center justify-between">
      <Logo size={34} showWord={false} />
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-1.5 bg-white rounded-full pl-4 pr-3 py-2 text-sm font-semibold text-brand-navy shadow-card">
          {scope} <ChevronDown className="w-4 h-4 text-brand-green" />
        </button>
        <button onClick={() => nav("/notifications")} className="relative w-10 h-10 rounded-full bg-white shadow-card grid place-items-center text-brand-navy">
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
