import { useState } from "react";
import PostCard from "../components/PostCard.jsx";
import { PostSkeleton } from "../components/Skeleton.jsx";
import { usePosts } from "../store/PostsContext.jsx";
import { useAuth } from "../store/AuthContext.jsx";
import Discover from "../components/Discover.jsx";

export default function Home() {
  const { posts, loading } = usePosts();
  const { user, followingIds } = useAuth();
  const [tab, setTab] = useState("foryou");
  const following = tab === "following";

  const visible = following
    ? posts.filter((p) => followingIds.has(p.authorId) || p.authorId === user?.uid)
    : posts;
  const showDiscover = !following && followingIds.size < 5;

  const Tab = ({ id, label }) => (
    <button onClick={() => setTab(id)}
      className={`flex-1 py-2 rounded-full text-sm font-semibold transition ${
        tab === id ? "bg-brand-green text-white" : "text-brand-navy"}`}>
      {label}
    </button>
  );

  return (
    <div className="px-4 pt-2 pb-6 space-y-4">
      <div className="flex gap-1 bg-white rounded-full p-1 shadow-card">
        <Tab id="foryou" label="For You" />
        <Tab id="following" label="Following" />
      </div>

      {showDiscover && <Discover />}

      {loading ? (
        [0, 1, 2].map((i) => <PostSkeleton key={i} />)
      ) : following && visible.length === 0 ? (
        <div className="pt-6">
          <div className="text-center text-muted px-8 mb-5">
            <p className="font-semibold text-brand-navy text-lg mb-1">Your following feed is quiet</p>
            <p className="text-sm">Follow explorers to see their adventures here.</p>
          </div>
          <Discover />
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center text-muted mt-16 px-8">
          <p className="font-semibold text-brand-navy text-lg mb-1">Your feed&apos;s quiet</p>
          <p className="text-sm">Tap + to post your first adventure.</p>
        </div>
      ) : (
        visible.map((p) => <PostCard key={p.id} post={p} />)
      )}
    </div>
  );
}
