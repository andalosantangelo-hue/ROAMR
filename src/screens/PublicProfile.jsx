import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase.js";
import { useAuth } from "../store/AuthContext.jsx";
import StatusBar from "../components/StatusBar.jsx";
import PostCard from "../components/PostCard.jsx";
import FollowButton from "../components/FollowButton.jsx";
import { PostSkeleton } from "../components/Skeleton.jsx";
import { Profile as UserIcon } from "../components/Icons.jsx";

export default function PublicProfile() {
  const { uid } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [p, setP] = useState(null);
  const [loadingP, setLoadingP] = useState(true);
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const isMe = user && user.uid === uid;

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

  return (
    <div className="h-full flex flex-col bg-white">
      <StatusBar />
      <div className="flex items-center gap-3 px-5 py-3">
        <button onClick={() => nav(-1)} className="text-brand-navy text-2xl leading-none">‹</button>
        <h1 className="text-lg font-semibold text-brand-navy truncate">{loadingP ? "Profile" : name}</h1>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="px-6 pt-3 pb-5 flex flex-col items-center text-center border-b border-black/5">
          {p?.photoURL ? (
            <img src={p.photoURL} alt="" className="w-24 h-24 rounded-full object-cover" />
          ) : (
            <span className="w-24 h-24 rounded-full bg-brand-navy text-brand-greenBright grid place-items-center">
              <UserIcon className="w-12 h-12" />
            </span>
          )}
          <h2 className="text-xl font-extrabold text-brand-navy mt-3">{name}</h2>
          {p?.bio && <p className="text-ink/80 text-sm mt-1 max-w-xs">{p.bio}</p>}
          <div className="flex gap-6 mt-3 text-center">
            <div><span className="font-bold text-brand-navy">{p?.followerCount ?? 0}</span> <span className="text-muted text-sm">followers</span></div>
            <div><span className="font-bold text-brand-navy">{p?.followingCount ?? 0}</span> <span className="text-muted text-sm">following</span></div>
          </div>
          {!isMe && <div className="mt-4"><FollowButton targetUid={uid} variant="pill" /></div>}
        </div>

        <div className="px-4 py-4 space-y-4">
          {loadingPosts ? [0, 1].map((i) => <PostSkeleton key={i} />)
            : posts.length === 0
              ? <p className="text-center text-muted text-sm mt-8">No posts yet.</p>
              : posts.map((post) => <PostCard key={post.id} post={post} />)}
        </div>
      </div>
    </div>
  );
}
