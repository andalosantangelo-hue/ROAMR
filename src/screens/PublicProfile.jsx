import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase.js";
import { useAuth } from "../store/AuthContext.jsx";
import { useMessages } from "../store/MessagesContext.jsx";
import StatusBar from "../components/StatusBar.jsx";
import PostCard from "../components/PostCard.jsx";
import FollowButton from "../components/FollowButton.jsx";
import { PostSkeleton } from "../components/Skeleton.jsx";
import { Profile as UserIcon, Comment, Edit } from "../components/Icons.jsx";

const INTEREST_LABELS = {
  outdoor: "Outdoor Adventures", water: "Water Activities", wheel: "Wheel Sports",
  nature: "Nature & Wildlife", snow: "Snow Adventures",
};

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

  const message = async () => {
    if (opening) return;
    setOpening(true);
    try {
      const tid = await openThread({ uid, name, photo: p?.photoURL || "" });
      if (tid) nav(`/chat/${tid}`);
    } catch (e) { console.warn("openThread:", e.message); }
    finally { setOpening(false); }
  };

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
          {p?.photoURL ? (
            <img src={p.photoURL} alt="" className="w-full aspect-square object-cover" />
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

          {interests.length > 0 && (
            <div className="mt-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-brand-navy/60 mb-2">Into</p>
              <div className="flex flex-wrap gap-2">
                {interests.map((i) => (
                  <span key={i} className="px-3.5 py-1.5 rounded-full bg-white border border-brand-green/30 text-brand-navy text-[13px] font-semibold">
                    {INTEREST_LABELS[i] || i}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Posts */}
        <div className="px-4 py-5 mt-1 space-y-4">
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
