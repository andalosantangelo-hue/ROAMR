import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, limit, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase.js";
import { useAuth } from "../store/AuthContext.jsx";
import { useTribes } from "../store/TribesContext.jsx";
import FollowButton from "./FollowButton.jsx";
import JoinButton from "./JoinButton.jsx";
import { initials } from "../lib/util.js";
import { Tribes as TribesIcon } from "./Icons.jsx";

export default function Discover() {
  const nav = useNavigate();
  const { user, profile, followingIds, blockedIds } = useAuth();
  const { tribes, joinedIds, toggleMembership } = useTribes();
  const [people, setPeople] = useState([]);

  useEffect(() => {
    if (!user) return;
    getDocs(query(collection(db, "users"), limit(20)))
      .then((snap) => {
        const list = snap.docs
          .map((d) => ({ uid: d.id, ...d.data() }))
          .filter((u) => u.uid !== user.uid && !followingIds.has(u.uid) && !blockedIds.has(u.uid));
        setPeople(list.slice(0, 8));
      })
      .catch(() => {});
  }, [user, followingIds, blockedIds]);

  const interests = profile?.interests || [];
  const suggestedTribes = tribes
    .filter((t) => !joinedIds.has(t.id))
    .sort((a, b) => (interests.includes(b.category) ? 1 : 0) - (interests.includes(a.category) ? 1 : 0))
    .slice(0, 6);

  if (suggestedTribes.length === 0 && people.length === 0) return null;

  return (
    <div className="space-y-5 mb-5">
      {suggestedTribes.length > 0 && (
        <section>
          <h3 className="font-bold text-brand-navy px-1 mb-2">Tribes for you</h3>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
            {suggestedTribes.map((t) => (
              <div key={t.id} className="shrink-0 w-40 bg-white rounded-2xl shadow-card overflow-hidden">
                <button onClick={() => nav("/app/tribes")} className="block w-full h-20 bg-brand-tint">
                  {t.img ? <img src={t.img} alt="" className="w-full h-full object-cover" />
                    : <span className="w-full h-full grid place-items-center text-brand-navy/40"><TribesIcon className="w-7 h-7" /></span>}
                </button>
                <div className="p-2.5">
                  <div className="font-semibold text-ink text-[13px] truncate">{t.name}</div>
                  <div className="text-muted text-[11px] mb-2">{t.memberCount ?? t.members ?? 0} members</div>
                  <JoinButton joined={joinedIds.has(t.id)} onToggle={() => toggleMembership(t)} className="w-full px-0 py-1.5 text-[13px]" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {people.length > 0 && (
        <section>
          <h3 className="font-bold text-brand-navy px-1 mb-2">People to follow</h3>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
            {people.map((p) => (
              <div key={p.uid} className="shrink-0 w-32 bg-white rounded-2xl shadow-card p-3 flex flex-col items-center text-center">
                <button onClick={() => nav(`/u/${p.uid}`)}>
                  {p.photoURL ? <img src={p.photoURL} alt="" className="w-14 h-14 rounded-full object-cover" />
                    : <span className="w-14 h-14 rounded-full bg-brand-tint text-brand-navy grid place-items-center font-semibold">{initials(p.displayName || "")}</span>}
                </button>
                <div className="font-semibold text-ink text-[13px] truncate w-full mt-2">{p.displayName || "Explorer"}</div>
                <div className="mt-2"><FollowButton targetUid={p.uid} variant="pill" /></div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
