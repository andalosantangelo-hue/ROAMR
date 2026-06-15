import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import StatusBar from "../components/StatusBar.jsx";
import ChatThread from "../components/ChatThread.jsx";
import { Help } from "../components/Icons.jsx";

// Lightweight on-device responder — no data leaves the app.
const KB = [
  { k: ["activity", "create activity", "post activity", "plan", "trip", "event"], a: "To create an activity, open the Activities tab and tap the + button. Add a title, a location, a date & time, and a skill level — then post it so others can join. You'll get a notification when someone joins." },
  { k: ["tribe", "group", "join tribe", "community", "club"], a: "Tribes are groups built around an activity or place. Open the Tribes tab, tap a tribe to see its members and group chat, then tap Join. Members can chat and plan trips together in the tribe's group chat." },
  { k: ["message", "dm", "chat", "direct"], a: "To message someone, open their profile and tap Message — that starts a private chat. All your conversations live under Profile → Messages." },
  { k: ["profile", "edit", "photo", "bio", "name"], a: "Go to Profile → Edit Profile to update your name, photo, and bio. Your name is shown on your posts and activities." },
  { k: ["gear", "marketplace", "sell", "buy", "rent", "listing"], a: "In the Marketplace tab you can list gear to sell or rent — add a category, price, and photos. Check the ROAMR Apparel tab for official ROAMR gear." },
  { k: ["apparel", "merch", "clothing", "official"], a: "Official ROAMR apparel is in Marketplace → ROAMR Apparel. Our first drop is coming soon — tap “Notify me at drop” to be first in line." },
  { k: ["safe", "safety", "secure", "stranger"], a: "Stay safe: meet new people in public places first, share your plans with a friend, check the weather and trail conditions, and know your limits. Tap the ⋯ menu on any post or profile to report anything that feels off." },
  { k: ["report", "block", "abuse"], a: "Tap the ⋯ menu on any post or profile and choose Report or Block. Our team reviews every report. Blocking hides that person from you." },
  { k: ["premium", "subscription", "pay", "plan", "membership"], a: "ROAMR Premium is on the way. You can join the waitlist from Profile → Membership and we'll let you know when it launches." },
  { k: ["delete", "account", "remove"], a: "To delete your account, go to Profile → Account Settings → Delete Account. This permanently removes your data." },
  { k: ["follow", "following", "feed", "home"], a: "Follow other explorers from their profile. Your Home feed shows posts and activities from the people and tribes you follow." },
  { k: ["guide", "guides", "how to", "start", "getting started"], a: "Check out Help Center → Guides for step-by-step walkthroughs on getting started, creating activities, joining tribes, and staying safe outdoors." },
];

const SUGGESTIONS = ["How do I create an activity?", "How do tribes work?", "How do I message someone?", "Is it safe to meet up?"];

function reply(text) {
  const t = text.toLowerCase();
  let best = null, bestScore = 0;
  for (const e of KB) {
    const score = e.k.reduce((n, kw) => n + (t.includes(kw) ? (kw.length > 6 ? 2 : 1) : 0), 0);
    if (score > bestScore) { bestScore = score; best = e; }
  }
  if (best && bestScore > 0) return best.a;
  return "I'm the ROAMR Assistant — I can help with activities, tribes, messaging, gear, your profile, and staying safe. Try asking one of those, or email support@roamr.app and a human will help.";
}

export default function HelpBot() {
  const nav = useNavigate();
  const [messages, setMessages] = useState([
    { id: "g0", uid: "bot", name: "ROAMR Assistant", text: "Hi! I'm the ROAMR Assistant 👋 Ask me anything about using the app." },
  ]);
  const [showChips, setShowChips] = useState(true);
  const idRef = useRef(0);

  const handle = async (text) => {
    setShowChips(false);
    const uid1 = `u${(idRef.current += 1)}`;
    const bid = `b${(idRef.current += 1)}`;
    setMessages((m) => [...m, { id: uid1, uid: "me", text }]);
    await new Promise((r) => setTimeout(r, 250));
    setMessages((m) => [...m, { id: bid, uid: "bot", name: "ROAMR Assistant", text: reply(text) }]);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <StatusBar />
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-black/5">
        <button onClick={() => nav(-1)} aria-label="Back" className="text-brand-navy text-2xl leading-none">‹</button>
        <span className="w-9 h-9 rounded-full bg-brand-navy text-brand-greenBright grid place-items-center">
          <Help className="w-5 h-5" />
        </span>
        <h1 className="text-lg font-semibold text-brand-navy">ROAMR Assistant</h1>
      </div>

      {showChips && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-2.5 border-b border-black/5">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => handle(s)}
              className="shrink-0 px-3.5 py-1.5 rounded-full bg-brand-tint text-brand-navy text-[13px] font-semibold">
              {s}
            </button>
          ))}
        </div>
      )}

      <ChatThread messages={messages} meUid="me" onSend={handle} showNames placeholder="Ask the ROAMR Assistant…" />
    </div>
  );
}
