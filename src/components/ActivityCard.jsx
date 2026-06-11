import { Heart, Comment, Send, Bookmark } from "./Icons.jsx";
import CardMenu from "./CardMenu.jsx";
import JoinButton from "./JoinButton.jsx";
import { useActivities } from "../store/ActivitiesContext.jsx";
import { useNavigate } from "react-router-dom";
import { usePosts } from "../store/PostsContext.jsx";
import { initials } from "../lib/util.js";
import FollowButton from "./FollowButton.jsx";
import { shareInvite } from "../lib/share.js";

const fmt = (a) => {
  if (a.time) return a.time;
  const ts = a.createdAt;
  if (!ts) return "Just now";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

export default function ActivityCard({ item }) {
  const nav = useNavigate();
  const { joinedIds, likedIds, toggleAttend, toggleLike } = useActivities();
  const { savedIds, toggleSave } = usePosts();

  const joined = joinedIds.has(item.id);
  const liked = likedIds.has(item.id);
  const saved = savedIds.has(item.id);
  const goAuthor = () => item.authorId && nav(`/u/${item.authorId}`);

  const name = item.user || item.authorName || "Explorer";
  const avatar = item.avatar || item.authorPhotoURL;
  const comments = item.comments ?? item.commentCount ?? 0;

  const avatarUrls = (item.recentAttendees?.map((a) => a.photoURL)) || item.attendees || [];
  const shown = avatarUrls.slice(0, 3);
  const totalAtt = item.attendeeCount ?? ((item.attendees?.length || 0) + (item.extraCount || 0));
  const extra = Math.max(0, totalAtt - shown.length);
  const hasRow = item.photo || avatarUrls.length > 0;

  return (
    <article className="bg-white rounded-2xl shadow-card px-4 py-3.5">
      <div className="flex items-center gap-3">
        {avatar ? <img src={avatar} alt="" onClick={goAuthor} className="w-9 h-9 rounded-full object-cover cursor-pointer" />
          : <span onClick={goAuthor} className="w-9 h-9 rounded-full bg-brand-tint text-brand-navy grid place-items-center text-xs font-semibold cursor-pointer">{initials(name)}</span>}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span onClick={goAuthor} className="font-semibold text-ink text-[15px] truncate cursor-pointer">{name}</span>
            <FollowButton targetUid={item.authorId} />
          </div>
          <span className="text-muted text-[12px]">{fmt(item)}</span>
        </div>
        <CardMenu targetType="activity" targetId={item.id} ownerId={item.authorId} />
      </div>

      <p className="text-ink text-[15px] mt-2.5">{item.text}</p>

      <div className="flex items-center gap-3 mt-3">
        {item.photo && <img src={item.photo} alt="" className="w-14 h-14 rounded-xl object-cover bg-brand-tint" />}
        {avatarUrls.length > 0 && (
          <div className="flex items-center">
            <div className="flex -space-x-2">
              {shown.map((a, i) => (
                a ? <img key={i} src={a} alt="" className="w-7 h-7 rounded-full border-2 border-white object-cover" />
                  : <span key={i} className="w-7 h-7 rounded-full border-2 border-white bg-brand-tint" />
              ))}
            </div>
            {extra > 0 && <span className="ml-1 text-[12px] text-muted font-medium">+{extra}</span>}
          </div>
        )}
        <JoinButton joined={joined} onToggle={() => toggleAttend(item)} className={hasRow ? "ml-auto" : ""} />
      </div>

      <div className="flex items-center gap-5 mt-3 pt-3 border-t border-black/5 text-ink">
        <button onClick={() => toggleLike(item)} className="flex items-center gap-1.5 text-[14px]">
          <Heart className={`w-[22px] h-[22px] ${liked ? "fill-brand-green text-brand-green" : ""}`} />
          {item.likeCount ?? item.likes ?? 0}
        </button>
        <button onClick={() => nav(`/comments/activities/${item.id}`)} className="flex items-center gap-1.5 text-[14px]">
          <Comment className="w-[22px] h-[22px]" /> {comments}
        </button>
        <button className="ml-auto" onClick={() => shareInvite({ title: "Join me on ROAMR", text: item.text || "", type: "activity", id: item.id })}><Send className="w-[22px] h-[22px]" /></button>
        <button onClick={() => toggleSave(item, "activities")}>
          <Bookmark className={`w-[22px] h-[22px] ${saved ? "fill-brand-green text-brand-green" : ""}`} />
        </button>
      </div>
    </article>
  );
}
