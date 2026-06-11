import { Star, Heart, Comment, Send, Bookmark } from "./Icons.jsx";
import CardMenu from "./CardMenu.jsx";
import { useNavigate } from "react-router-dom";
import { usePosts } from "../store/PostsContext.jsx";
import { initials } from "../lib/util.js";
import FollowButton from "./FollowButton.jsx";
import { shareInvite } from "../lib/share.js";

function Pin({ className = "w-4 h-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z" /><circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
const fmtDate = (p) => {
  if (p.date) return p.date;
  const ts = p.createdAt;
  if (!ts) return "Just now";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

export default function PostCard({ post }) {
  const nav = useNavigate();
  const { likedIds, savedIds, toggleLike, toggleSave } = usePosts();
  const liked = likedIds.has(post.id);
  const goAuthor = () => post.authorId && nav(`/u/${post.authorId}`);
  const saved = savedIds.has(post.id);

  const name = post.user || post.authorName || "Explorer";
  const avatar = post.avatar || post.authorPhotoURL;
  const comments = post.comments ?? post.commentCount ?? 0;

  return (
    <article className="bg-white rounded-2xl shadow-card overflow-hidden">
      <div className="flex items-center gap-3 px-4 pt-3.5 pb-2.5">
        {avatar ? (
          <img src={avatar} alt="" onClick={goAuthor} className="w-9 h-9 rounded-full object-cover cursor-pointer" />
        ) : (
          <span onClick={goAuthor} className="w-9 h-9 rounded-full bg-brand-tint text-brand-navy grid place-items-center text-xs font-semibold cursor-pointer">{initials(name)}</span>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span onClick={goAuthor} className="font-semibold text-ink text-[15px] truncate cursor-pointer">{name}</span>
            <FollowButton targetUid={post.authorId} />
          </div>
          <span className="text-muted text-[12px]">{fmtDate(post)}</span>
        </div>
        <CardMenu targetType="post" targetId={post.id} ownerId={post.authorId} />
      </div>

      {post.photo && (
        <div className="px-3">
          <img src={post.photo} alt={post.title} className="w-full h-52 object-cover rounded-xl bg-brand-tint" loading="lazy" />
        </div>
      )}

      <div className="px-4 pt-3">
        <h3 className="font-semibold text-ink leading-snug">{post.title}</h3>
        {post.location && (
          <div className="flex items-center gap-1 text-muted text-[13px] mt-1">
            <Pin className="w-4 h-4 text-brand-green" /> {post.location}
          </div>
        )}
        {post.rating > 0 && (
          <div className="flex gap-0.5 mt-1.5 text-brand-green">
            {[1, 2, 3, 4, 5].map((n) => <Star key={n} filled={n <= post.rating} className="w-4 h-4" />)}
          </div>
        )}
      </div>

      <div className="flex items-center gap-5 px-4 py-3.5 text-ink">
        <button onClick={() => toggleLike(post)} className="flex items-center gap-1.5 text-[14px]">
          <Heart className={`w-[22px] h-[22px] ${liked ? "fill-brand-green text-brand-green" : ""}`} />
          {post.likeCount ?? post.likes ?? 0}
        </button>
        <button onClick={() => nav(`/comments/posts/${post.id}`)} className="flex items-center gap-1.5 text-[14px]">
          <Comment className="w-[22px] h-[22px]" /> {comments}
        </button>
        <button className="ml-auto" onClick={() => shareInvite({ title: post.title || "Check this out on ROAMR", text: "on ROAMR", type: "post", id: post.id })}><Send className="w-[22px] h-[22px]" /></button>
        <button onClick={() => toggleSave(post)}>
          <Bookmark className={`w-[22px] h-[22px] ${saved ? "fill-brand-green text-brand-green" : ""}`} />
        </button>
      </div>
    </article>
  );
}
