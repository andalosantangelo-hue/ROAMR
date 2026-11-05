import PostCard from "../components/PostCard.jsx";
import { SkeletonRegion, PostCardSkeleton } from "../components/skeletons";
import { usePosts } from "../store/PostsContext.jsx";
import { useAuth } from "../store/AuthContext.jsx";
import { useFeedScope } from "../store/FeedScopeContext.jsx";
import { applyScope, feedCtx } from "../lib/feed.js";
import Discover from "../components/Discover.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { Home as HomeIcon, Tribes as TribesIcon, Activities as CompassIcon } from "../components/Icons.jsx";

const EMPTY = {
  following: { Icon: TribesIcon, title: "Your following feed is quiet", body: "Follow explorers below to see their adventures here." },
  nearby: { Icon: CompassIcon, title: "Nothing nearby yet", body: "Set your home base so we can show posts near you, or be the first to post here." },
  foryou: { Icon: HomeIcon, title: "Your feed's quiet", body: "Share your first adventure, or join a tribe to fill it up." },
};

export default function Home() {
  const { posts, loading } = usePosts();
  const { user, profile, followingIds } = useAuth();
  const { scope, setScope } = useFeedScope();

  const ctx = feedCtx(profile, followingIds, user?.uid);
  const visible = applyScope(posts, scope, ctx);
  const empty = EMPTY[scope] || EMPTY.foryou;
  const emptyActions = scope === "following"
    ? [{ label: "Show everything", onClick: () => setScope("foryou") }]
    : scope === "nearby"
      ? [{ label: "Set home base", to: "/edit-profile" }, { label: "Post the first one", to: "/create-post" }]
      : [{ label: "Share an adventure", to: "/create-post" }, { label: "Find a tribe", to: "/app/tribes" }];
  // Surface Discover when the personalized/nearby feed is thin on follows.
  const showDiscover = scope !== "following" && followingIds.size < 5 && visible.length > 0;

  return (
    <div className="px-4 pt-2 pb-6 space-y-4">
      {showDiscover && <Discover />}

      {loading ? (
        <SkeletonRegion label="Loading posts" className="space-y-4">
          {[0, 1, 2].map((i) => <PostCardSkeleton key={i} />)}
        </SkeletonRegion>
      ) : visible.length === 0 ? (
        <div className="pt-6">
          <EmptyState Icon={empty.Icon} title={empty.title} body={empty.body} actions={emptyActions} className="mb-6" />
          {scope !== "foryou" && <Discover />}
        </div>
      ) : (
        visible.map((p) => <PostCard key={p.id} post={p} />)
      )}
    </div>
  );
}
