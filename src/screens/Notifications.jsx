import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase.js";
import { useAuth } from "../store/AuthContext.jsx";
import StatusBar from "../components/StatusBar.jsx";
import VerifyCard from "../components/VerifyBanner.jsx";
import FollowButton from "../components/FollowButton.jsx";
import { initials, titleCase } from "../lib/util.js";
import { Heart, Comment, Tribes as TribesIcon, Profile as UserIcon, Activities as ActIcon } from "../components/Icons.jsx";

const ICON = { like: Heart, comment: Comment, join: ActIcon, tribe: TribesIcon, follow: UserIcon, message: Comment };

// Fallback verbs for older notification docs that only stored "Someone …" text.
const VERB = {
  follow: "started following you",
  like: "liked your post",
  comment: "commented on your post",
  join: "joined your activity",
  tribe: "joined your tribe",
  message: "sent you a message",
};

const fmt = (ts) => {
  if (!ts) return "now";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h`;
  if (mins < 60 * 24 * 7) return `${Math.round(mins / 1440)}d`;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
};

// Strip the actor's name (or "Someone") from the stored sentence so we can
// render "<bold name> <action>" no matter which server version wrote it.
function actionText(n, name) {
  if (n.action) return n.action;
  const t = n.text || "";
  for (const lead of [name, n.actorName, "Someone"].filter(Boolean)) {
    if (t.startsWith(lead + " ")) return t.slice(lead.length + 1);
  }
  return VERB[n.type] || t;
}

function Avatar({ src, name, onClick, type }) {
  const Icon = ICON[type] || Heart;
  return (
    <button onClick={onClick} aria-label={`View ${name}'s profile`} className="relative shrink-0">
      {src ? (
        <img src={src} alt="" className="w-11 h-11 rounded-full object-cover bg-brand-tint" />
      ) : (
        <span className="w-11 h-11 rounded-full bg-brand-navy text-brand-greenBright grid place-items-center text-sm font-semibold">
          {initials(name)}
        </span>
      )}
      <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-brand-green text-white grid place-items-center ring-2 ring-white">
        <Icon className="w-3 h-3" />
      </span>
    </button>
  );
}

export default function Notifications() {
  const nav = useNavigate();
  const { notifications, markNotifsRead } = useAuth();
  const [people, setPeople] = useState({}); // uid -> { displayName, photoURL }

  useEffect(() => { markNotifsRead(); /* mark read on open */ }, []); // eslint-disable-line

  // Hydrate actor profiles for every notification (old docs only stored actorUid).
  const missing = useMemo(() => [...new Set(
    notifications.map((n) => n.actorUid).filter((u) => u && !people[u])
  )], [notifications, people]);

  useEffect(() => {
    if (!missing.length) return;
    let alive = true;
    Promise.all(missing.map(async (uid) => {
      try {
        const s = await getDoc(doc(db, "users", uid));
        return [uid, s.exists() ? s.data() : { displayName: null, photoURL: null }];
      } catch { return [uid, { displayName: null, photoURL: null }]; }
    })).then((rows) => { if (alive) setPeople((p) => ({ ...p, ...Object.fromEntries(rows) })); });
    return () => { alive = false; };
  }, [missing]);

  return (
    <div className="h-full flex flex-col bg-white">
      <StatusBar />
      <div className="flex items-center gap-3 px-5 py-3 border-b border-black/5">
        <button onClick={() => nav(-1)} aria-label="Back" className="text-brand-navy text-2xl leading-none w-11 h-11 -ml-3 grid place-items-center">‹</button>
        <h1 className="text-lg font-semibold text-brand-navy">Notifications</h1>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <VerifyCard />
        {notifications.length === 0 ? (
          <div className="text-center text-muted mt-20 px-8">
            <p className="font-semibold text-brand-navy">You're all caught up</p>
            <p className="text-sm mt-1">Likes, comments, joins and follows show up here.</p>
          </div>
        ) : notifications.map((n) => {
          const p = (n.actorUid && people[n.actorUid]) || {};
          const rawName = n.actorName || p.displayName || "An explorer";
          const name = titleCase(rawName);
          const photo = n.actorPhoto || p.photoURL || null;
          const toProfile = () => n.actorUid && nav(`/u/${n.actorUid}`);
          const open = () => (n.link ? nav(n.link) : toProfile());
          return (
            <div key={n.id}
              className={`w-full flex items-center gap-3 px-5 py-3 border-b border-black/5 ${n.read ? "" : "bg-brand-tint/40"}`}>
              <Avatar src={photo} name={name} type={n.type} onClick={toProfile} />
              <button onClick={open} className="flex-1 min-w-0 text-left min-h-[44px]">
                <p className="text-ink text-[14px] leading-snug">
                  <span className="font-semibold">{name}</span> {actionText(n, rawName)}
                  <span className="text-muted text-[12px] ml-1.5">{fmt(n.createdAt)}</span>
                </p>
              </button>
              {n.type === "follow" && n.actorUid
                ? <FollowButton targetUid={n.actorUid} variant="pill" />
                : !n.read && <span className="w-2 h-2 rounded-full bg-brand-green shrink-0" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
