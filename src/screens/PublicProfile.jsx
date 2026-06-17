import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase.js";
import { useAuth } from "../store/AuthContext.jsx";
import { useMessages } from "../store/MessagesContext.jsx";
import { STYLE, PACE, TRAVEL, ACTIVITIES, labelOf } from "../lib/profile.js";
import StatusBar from "../components/StatusBar.jsx";
import PostCard from "../components/PostCard.jsx";
import FollowButton from "../components/FollowButton.jsx";
import { PostSkeleton } from "../components/Skeleton.jsx";
import { Profile as UserIcon, Comment, Edit, Check } from "../components/Icons.jsx";

const ACT_LABEL = Object.fromEntries(ACTIVITIES.map((a) => [a.id, a.label]));

function PromptCard({ q, a }) {
  return (
    <div className="rounded-2xl bg-white border border-black/5 shadow-card p-4">
      <p className="text-[12px] font-semibold text-brand-navy/55">{q}</p>
      <p className="text-ink text-[17px] font-medium leading-snug mt-1">{a}</p>
    </div>
  );
}
const Vital = ({ label, value }) => (
  <div className="rounded-xl bg-brand-tint px-3 py-2">
    <p className="text-[10px] font-bold uppercase tracking-wide text-brand-navy/50">{label}</p>
    <p className="text-ink text-[14px] font-semibold">{value}</p>
  </div>
);

export default function PublicProfile() {
  const { uid } = useParams();
  const nav = useNavigate();
  const { user, blockedIds, unblockUser } = useAuth();
  const { openThread } = useMessages();
  const [p, setP] = useState(null);
  const [loadingP, setLoadingP] = useState(true);
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [opening, setOpening] = useState(false);
  const isMe = user && user.uid === uid;
  const blocked = blockedIds?.has(uid);

  useEffect(() => {
    setLoadingP(true);
    getDoc(doc(db, "users", uid))
      .then((s) => setP(s.exists() ? s.data() : null))
      .catch(() => setP(null))
      .finally(() => setLoadingP(false));
  }, [uid]);

  useEffect(() => {
    const q = query(collection(db, "posts"), where("authorId", "==", uid), orderBy("createdAt", "desc"), limit(20));
    return onSnapshot(q,
      (snap) => { setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); setLoadingPosts(false); },
      (e) => { console.warn("profile posts:", e.message); setLoadingPosts(false); });
  }, [uid]);

  const name = p?.displayName || (p?.email ? p.email.split("@")[0] : "Explorer");
  const interests = Array.isArray(p?.interests) ? p.interests : [];
  const skills = p?.skillLevels || {};
  const photos = (p?.photos && p.photos.length ? p.photos : (p?.photoURL ? [p.photoURL] : []));
  const prompts = Array.isArray(p?.prompts) ? p.prompts.filter((x) => x && x.a) : [];
  const extraPhotos = photos.slice(1);
  const availability = p?.availability || [];
  const lookingFor = p?.lookingFor || [];
  const certs = p?.certifications || [];
  const gear = p?.gearShare || [];

  const message = async () => {
    if (opening) return;
    setOpening(true);
    try {
      const tid = await openThread({ uid, name, photo: photos[0] || "" });
      if (tid) nav(`/chat/${tid}`);
    } catch (e) { console.warn("openThread:", e.message); }
    finally { setOpening(false); }
  };

  // Interleave remaining photos with prompts, Hinge-style.
  const stream = [];
  const maxLen = Math.max(prompts.length, extraPhotos.length);
  for (let i = 0; i < maxLen; i++) {
    if (prompts[i]) stream.push({ t: "prompt", v: prompts[i], k: `p${i}` });
    if (extraPhotos[i]) stream.push({ t: "photo", v: extraPhotos[i], k: `ph${i}` });
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <StatusBar />
      <div className="flex items-center gap-3 px-5 py-3">
        <button onClick={() => nav(-1)} aria-label="Back" className="text-brand-navy text-2xl leading-none">‹</button>
        <h1 className="text-lg font-semibold text-brand-navy truncate">{loadingP ? "Profile" : name}</h1>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Hero photo */}
        <div className="relative">
          {photos[0] ? (
            <img src={photos[0]} alt="" className="w-full aspect-square object-cover" />
          ) : (
            <div className="w-full aspect-square bg-brand-navy grid place-items-center">
              <UserIcon className="w-24 h-24 text-brand-greenBright" />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/65 to-transparent" />
          <div className="absolute left-5 right-5 bottom-3 text-white">
            <h2 className="text-2xl font-extrabold drop-shadow">{name}</h2>
            {p?.location && <p className="text-white/90 text-sm font-medium drop-shadow">{p.location}</p>}
          </div>
        </div>

        {/* Stats + actions */}
        <div className="px-5 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-6">
              <div><span className="font-bold text-brand-navy">{p?.followerCount ?? 0}</span> <span className="text-muted text-sm">followers</span></div>
              <div><span className="font-bold text-brand-navy">{p?.followingCount ?? 0}</span> <span className="text-muted text-sm">following</span></div>
            </div>
            {isMe ? (
              <button onClick={() => nav("/edit-profile")}
                className="rounded-full px-5 py-2 text-sm font-semibold bg-brand-tint text-brand-navy flex items-center gap-1.5">
                <Edit className="w-4 h-4" /> Edit
              </button>
            ) : blocked ? (
              <button onClick={() => unblockUser(uid)}
                className="rounded-full px-5 py-2 text-sm font-semibold bg-red-50 text-red-600 border border-red-200">
                Unblock
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <FollowButton targetUid={uid} variant="pill" />
                <button onClick={message} disabled={opening}
                  className="rounded-full px-5 py-2 text-sm font-semibold bg-brand-tint text-brand-navy flex items-center gap-1.5 active:scale-[0.98] transition">
                  <Comment className="w-4 h-4" /> Message
                </button>
              </div>
            )}
          </div>

          {p?.bio && (
            <div className="mt-4 rounded-2xl bg-brand-tint p-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-brand-navy/60 mb-1">About me</p>
              <p className="text-ink/90 text-[15px] leading-relaxed">{p.bio}</p>
            </div>
          )}

          {/* Activities + skill */}
          {interests.length > 0 && (
            <div className="mt-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-brand-navy/60 mb-2">Activities</p>
              <div className="flex flex-wrap gap-2">
                {interests.map((i) => (
                  <span key={i} className="px-3.5 py-1.5 rounded-full bg-white border border-brand-green/30 text-brand-navy text-[13px] font-semibold">
                    {ACT_LABEL[i] || i}{skills[i] ? <span className="text-brand-green"> · {skills[i]}</span> : null}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Vitals */}
          {(p?.style || p?.pace || p?.willTravel || availability.length > 0) && (
            <div className="grid grid-cols-2 gap-2 mt-4">
              {p?.style && <Vital label="Style" value={labelOf(STYLE, p.style)} />}
              {p?.pace && <Vital label="Pace" value={labelOf(PACE, p.pace)} />}
              {p?.willTravel && <Vital label="Will travel" value={labelOf(TRAVEL, p.willTravel)} />}
              {availability.length > 0 && <Vital label="Free" value={availability.join(", ")} />}
            </div>
          )}

          {lookingFor.length > 0 && (
            <div className="mt-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-brand-navy/60 mb-2">Looking for</p>
              <div className="flex flex-wrap gap-2">
                {lookingFor.map((x) => (
                  <span key={x} className="px-3 py-1.5 rounded-full bg-brand-navy text-white text-[12px] font-semibold">{x}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Prompts interleaved with extra photos */}
        {stream.length > 0 && (
          <div className="px-4 mt-5 space-y-3">
            {stream.map((s) => s.t === "prompt"
              ? <PromptCard key={s.k} q={s.v.q} a={s.v.a} />
              : <img key={s.k} src={s.v} alt="" className="w-full rounded-2xl object-cover" />)}
          </div>
        )}

        {/* Trust: certifications + gear */}
        {(certs.length > 0 || gear.length > 0) && (
          <div className="px-5 mt-5 space-y-4">
            {certs.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-brand-navy/60 mb-2">Certified</p>
                <div className="flex flex-wrap gap-2">
                  {certs.map((c) => (
                    <span key={c} className="px-3 py-1.5 rounded-full bg-brand-tint text-brand-navy text-[12px] font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-brand-green" /> {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {gear.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-brand-navy/60 mb-2">Gear to share</p>
                <div className="flex flex-wrap gap-2">
                  {gear.map((g) => (
                    <span key={g} className="px-3 py-1.5 rounded-full bg-brand-tint text-brand-navy text-[12px] font-semibold">{g}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Posts */}
        <div className="px-4 py-5 mt-2 space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-brand-navy/60 px-1">
            {isMe ? "My posts" : "Posts"}
          </p>
          {loadingPosts ? [0, 1].map((i) => <PostSkeleton key={i} />)
            : posts.length === 0
              ? <p className="text-center text-muted text-sm mt-2">{isMe ? "You haven't posted yet." : "No posts yet."}</p>
              : posts.map((post) => <PostCard key={post.id} post={post} />)}
        </div>
      </div>
    </div>
  );
}
