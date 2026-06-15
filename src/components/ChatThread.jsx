import { useEffect, useRef, useState } from "react";
import { Send } from "./Icons.jsx";

// messages: [{ id, uid, name, photo, text, createdAt }]
export default function ChatThread({ messages = [], meUid, onSend, placeholder = "Message…", showNames = false }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [messages.length]);

  const send = async () => {
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    setText("");
    try { await onSend(t); }
    catch (e) { console.warn("send:", e.message); setText(t); }
    finally { setBusy(false); }
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-3 space-y-2">
        {messages.length === 0 ? (
          <p className="text-center text-muted text-sm mt-10">No messages yet. Say hi 👋</p>
        ) : messages.map((m) => {
          const mine = m.uid === meUid;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[78%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                {showNames && !mine && m.name && (
                  <span className="text-[11px] text-muted mb-0.5 px-1">{m.name}</span>
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

      <div className="px-3 py-2.5 border-t border-black/5 flex items-end gap-2 bg-white">
        <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKey} rows={1}
          placeholder={placeholder}
          className="flex-1 resize-none max-h-28 rounded-2xl bg-brand-tint px-4 py-2.5 text-[15px] outline-none focus:ring-2 focus:ring-brand-green/30 placeholder:text-muted" />
        <button onClick={send} disabled={!text.trim() || busy} aria-label="Send"
          className={`w-10 h-10 shrink-0 rounded-full grid place-items-center transition ${
            text.trim() && !busy ? "bg-brand-green text-white" : "bg-black/10 text-white/80"}`}>
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
