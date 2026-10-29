import { useNavigate } from "react-router-dom";
import PostCard from "../components/PostCard.jsx";
import { PostSkeleton } from "../components/Skeleton.jsx";
import { usePosts } from "../store/PostsContext.jsx";
import { useAuth } from "../store/AuthContext.jsx";
import { useFeedScope } from "../store/FeedScopeContext.jsx";
import { applyScope, feedCtx } from "../lib/feed.js";
import Discover from "../components/Discover.jsx";

const EMPTY = {
  following: { title: "Your following feed is quiet", body: "Follow explorers to see their adventures here." },
  nearby: { title: "Nothing nearby yet", body: "Set your home base in your profile, or be the first to post here." },
  foryou: { title: "Your feed's quiet", body: "Post your first adventure and get things started." },
};

export default function Home() {
  const nav = useNavigate();
  const { posts, loading, error, retry } = usePosts();
  const { user, profile, followingIds } = useAuth();
  const { scope } = useFeedScope();

  const ctx = feedCtx(profile, followingIds, user?.uid);
  const visible = applyScope(posts, scope, ctx);
  const empty = EMPTY[scope] || EMPTY.foryou;
  // Surface Discover when the personalized/nearby feed is thin on follows.
  const showDiscover = scope !== "following" && followingIds.size < 5 && visible.length > 0;

  return (
    <div className="px-4 pt-2 pb-6 space-y-4">
      {showDiscover && <Discover />}

      {loading ? (
        [0, 1, 2].map((i) => <PostSkeleton key={i} />)
      ) : error && visible.length === 0 ? (
        <div role="alert" className="mt-6 rounded-2xl bg-white border border-black/5 shadow-card p-5 text-center">
          <p className="font-semibold text-brand-navy text-lg mb-1">Couldn&apos;t load your feed</p>
          <p className="text-sm text-muted mb-4">Check your connection and try again.</p>
          <button onClick={retry} className="rounded-xl bg-brand-green hover:bg-brand-greenDark text-white font-semibold px-6 py-3 transition">
            Try again
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div className="pt-6">
          <div className="text-center text-muted px-8 mb-5">
            <p className="font-semibold text-brand-navy text-lg mb-1">{empty.title}</p>
            <p className="text-sm">{empty.body}</p>
            {scope === "foryou" && (
              <button onClick={() => nav("/create-post")}
                className="mt-4 rounded-xl bg-brand-green hover:bg-brand-greenDark text-white font-semibold px-6 py-3 transition">
                Post an adventure
              </button>
            )}
          </div>
          {scope !== "foryou" && <Discover />}
        </div>
      ) : (
        visible.map((p) => <PostCard key={p.id} post={p} />)
      )}
    </div>
  );
}
