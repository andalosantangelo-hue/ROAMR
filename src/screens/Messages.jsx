import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext.jsx";
import { useMessages } from "../store/MessagesContext.jsx";
import StatusBar from "../components/StatusBar.jsx";
import { Profile as UserIcon, Comment } from "../components/Icons.jsx";

export default function Messages() {
  const nav = useNavigate();
  const { user } = useAuth();
  const { threads, loading } = useMessages();

  return (
    <div className="h-full flex flex-col bg-white">
      <StatusBar />
      <div className="flex items-center gap-3 px-5 py-3 border-b border-black/5">
        <button onClick={() => nav(-1)} aria-label="Back" className="text-brand-navy text-2xl leading-none">‹</button>
        <h1 className="text-lg font-semibold text-brand-navy">Messages</h1>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {loading ? (
          <p className="text-center text-muted text-sm mt-10">Loading…</p>
        ) : threads.length === 0 ? (
          <div className="flex flex-col items-center text-center mt-20 px-8">
            <span className="w-20 h-20 rounded-2xl bg-brand-navy text-brand-greenBright grid place-items-center mb-5">
              <Comment className="w-10 h-10" />
            </span>
            <h2 className="text-lg font-extrabold text-brand-navy mb-1">No messages yet</h2>
            <p className="text-muted text-sm">Visit someone's profile and tap Message to start a chat.</p>
          </div>
        ) : (
          <ul className="divide-y divide-black/5">
            {threads.map((t) => {
              const otherUid = t.participants?.find((u) => u !== user?.uid);
              const name = (t.participantNames && otherUid && t.participantNames[otherUid]) || "Explorer";
              const photo = (t.participantPhotos && otherUid && t.participantPhotos[otherUid]) || "";
              return (
                <li key={t.id}>
                  <button onClick={() => nav(`/chat/${t.id}`)} className="w-full flex items-center gap-3 px-5 py-3.5 text-left">
                    {photo ? (
                      <img src={photo} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" />
                    ) : (
                      <span className="w-12 h-12 rounded-full bg-brand-navy text-brand-greenBright grid place-items-center shrink-0">
                        <UserIcon className="w-6 h-6" />
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-brand-navy truncate">{name}</p>
                      <p className="text-muted text-[13px] truncate">{t.lastMessage || "Start the conversation"}</p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
