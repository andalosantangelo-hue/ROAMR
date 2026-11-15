import { useEffect, useRef, useState } from "react";
import { Send } from "./Icons.jsx";
import { SkeletonRegion, ChatSkeleton } from "./skeletons";

const MAX_LEN = 4000; // matches the message size limit in firestore.rules

// messages: [{ id, uid, name, photo, text, createdAt }]; loading shows placeholder bubbles.
export default function ChatThread({ messages = [], loading = false, meUid, onSend, placeholder = "Message…", showNames = false, onAuthorClick }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [messages.length]);

  // Sending is held until the chat has loaded (e.g. a tribe membership the server
  // hasn't confirmed yet would be refused). A failed send keeps the text and says so.
  const canSend = !!text.trim() && !busy && !loading;
  const send = async () => {
    const t = text.trim();
    if (!canSend) return;
    setBusy(true); setError("");
    setText("");
    try { await onSend(t); }
    catch (e) { console.warn("send:", e.message); setText(t); setError("Your message didn't send. Check your connection and try again."); }
    finally { setBusy(false); }
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-3 space-y-2">
        {loading ? (
          <SkeletonRegion label="Loading messages" className="space-y-2"><ChatSkeleton /></SkeletonRegion>
        ) : messages.length === 0 ? (
          <p className="text-center text-muted text-sm mt-10">No messages yet. Say hi 👋</p>
        ) : messages.map((m) => {
          const mine = m.uid === meUid;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[78%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                {showNames && !mine && m.name && (
                  onAuthorClick ? (
                    <button onClick={() => onAuthorClick(m)} className="text-[11px] text-brand-green font-semibold mb-0.5 px-1 text-left">{m.name}</button>
                  ) : (
                    <span className="text-[11px] text-muted mb-0.5 px-1">{m.name}</span>
                  )
                )}
                <div className={`px-3.5 py-2 rounded-2xl text-[15px] leading-snug break-words ${
                  mine ? "bg-brand-green text-white rounded-br-md" : "bg-brand-tint text-ink rounded-bl-md"}`}>
                  {m.text}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {error && <p role="alert" className="text-red-600 text-sm px-4 pt-2">{error}</p>}
      <div className="px-3 py-2.5 border-t border-black/5 flex items-end gap-2 bg-white">
        <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKey} rows={1} maxLength={MAX_LEN}
          placeholder={placeholder}
          className="flex-1 resize-none max-h-28 rounded-2xl bg-brand-tint px-4 py-2.5 text-[15px] outline-none focus:ring-2 focus:ring-brand-green/30 placeholder:text-muted" />
        <button onClick={send} disabled={!canSend} aria-label="Send"
          className={`w-10 h-10 shrink-0 rounded-full grid place-items-center transition ${
            canSend ? "bg-brand-green text-white" : "bg-black/10 text-white/80"}`}>
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
