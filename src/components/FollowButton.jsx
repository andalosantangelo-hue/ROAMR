import { useAuth } from "../store/AuthContext.jsx";

export default function FollowButton({ targetUid, variant = "inline" }) {
  const { user, followingIds, toggleFollow } = useAuth();
  if (!targetUid || (user && targetUid === user.uid)) return null;
  const following = followingIds.has(targetUid);

  const click = (e) => { e.stopPropagation(); toggleFollow(targetUid); };

  if (variant === "pill") {
    return (
      <button onClick={click}
        className={`rounded-full px-6 py-2 text-sm font-semibold transition ${
          following ? "bg-white text-brand-green border border-brand-green" : "bg-brand-green text-white hover:bg-brand-greenDark"}`}>
        {following ? "Following" : "Follow"}
      </button>
    );
  }
  return (
    <button onClick={click} className={`text-[13px] font-semibold ${following ? "text-muted" : "text-brand-green"}`}>
      {following ? "Following" : "Follow"}
    </button>
  );
}
