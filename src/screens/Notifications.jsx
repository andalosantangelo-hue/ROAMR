import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext.jsx";
import StatusBar from "../components/StatusBar.jsx";
import { Heart, Comment, Tribes as TribesIcon, Profile as UserIcon, Activities as ActIcon } from "../components/Icons.jsx";

const ICON = { like: Heart, comment: Comment, join: ActIcon, tribe: TribesIcon, follow: UserIcon };
const fmt = (ts) => {
  if (!ts) return "now";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
};

export default function Notifications() {
  const nav = useNavigate();
  const { notifications, markNotifsRead } = useAuth();

  useEffect(() => { markNotifsRead(); /* mark read on open */ }, []); // eslint-disable-line

  return (
    <div className="h-full flex flex-col bg-white">
      <StatusBar />
      <div className="flex items-center gap-3 px-5 py-3 border-b border-black/5">
        <button onClick={() => nav(-1)} className="text-brand-navy text-2xl leading-none">‹</button>
        <h1 className="text-lg font-semibold text-brand-navy">Notifications</h1>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {notifications.length === 0 ? (
          <div className="text-center text-muted mt-20 px-8">
            <p className="font-semibold text-brand-navy">You're all caught up</p>
            <p className="text-sm mt-1">Likes, comments, joins and follows show up here.</p>
          </div>
        ) : notifications.map((n) => {
          const Icon = ICON[n.type] || Heart;
          return (
            <button key={n.id} onClick={() => n.link && nav(n.link)}
              className={`w-full flex items-center gap-3 px-5 py-3.5 text-left border-b border-black/5 ${n.read ? "" : "bg-brand-tint/40"}`}>
              <span className="w-9 h-9 rounded-full bg-brand-navy text-brand-green grid place-items-center shrink-0">
                <Icon className="w-5 h-5" />
              </span>
              <span className="flex-1 text-ink text-[14px]">{n.text}</span>
              <span className="text-muted text-[12px] shrink-0">{fmt(n.createdAt)}</span>
              {!n.read && <span className="w-2 h-2 rounded-full bg-brand-green shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
