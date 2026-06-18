import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext.jsx";
import { useSafety } from "../store/SafetyContext.jsx";
import StatusBar from "../components/StatusBar.jsx";
import { Check } from "../components/Icons.jsx";

export default function Verify() {
  const nav = useNavigate();
  const { profile } = useAuth();
  const { submitVerification } = useSafety();
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const pick = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true); setError("");
    try { await submitVerification(f); setDone(true); }
    catch (err) { setError(err.message || "Could not submit."); }
    finally { setBusy(false); }
  };

  if (profile?.verified) {
    return (
      <div className="h-full flex flex-col bg-white">
        <StatusBar />
        <Header nav={nav} />
        <div className="flex-1 grid place-items-center px-8 text-center">
          <div>
            <span className="w-16 h-16 rounded-full bg-brand-green text-white grid place-items-center mx-auto mb-3"><Check className="w-8 h-8" /></span>
            <h2 className="text-xl font-extrabold text-brand-navy">You're verified</h2>
            <p className="text-muted text-sm mt-1">Your profile shows a verified badge.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <StatusBar />
      <Header nav={nav} />
      <div className="flex-1 px-6 pt-4 overflow-y-auto no-scrollbar">
        {done ? (
          <div className="rounded-2xl bg-brand-tint p-5 text-center">
            <span className="w-14 h-14 rounded-full bg-brand-green text-white grid place-items-center mx-auto mb-3"><Check className="w-7 h-7" /></span>
            <h2 className="text-lg font-extrabold text-brand-navy">Selfie submitted</h2>
            <p className="text-ink/75 text-sm mt-1">We'll review it shortly. Your verified badge appears once approved.</p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-extrabold text-brand-navy">Verify it's really you</h2>
            <p className="text-ink/75 text-[15px] mt-2 leading-relaxed">Take a clear selfie. We match it to your profile photos so partners know you're a real person. Your selfie is private and never shown on your profile.</p>
            <ul className="mt-4 space-y-2 text-ink/80 text-[14px]">
              <li className="flex gap-2"><Check className="w-5 h-5 text-brand-green shrink-0" /> Good lighting, face clearly visible</li>
              <li className="flex gap-2"><Check className="w-5 h-5 text-brand-green shrink-0" /> No hats or sunglasses</li>
              <li className="flex gap-2"><Check className="w-5 h-5 text-brand-green shrink-0" /> Looks like your profile photos</li>
            </ul>
            {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
          </>
        )}
      </div>
      {!done && (
        <div className="px-6 pb-7 pt-3">
          <button disabled={busy} onClick={() => fileRef.current?.click()}
            className="w-full rounded-xl bg-brand-green hover:bg-brand-greenDark text-white font-semibold py-4 disabled:opacity-60">
            {busy ? "Submitting…" : "Take a selfie"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" capture="user" onChange={pick} className="hidden" />
        </div>
      )}
    </div>
  );
}
function Header({ nav }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3 border-b border-black/5">
      <button onClick={() => nav(-1)} aria-label="Back" className="text-brand-navy text-2xl leading-none">‹</button>
      <h1 className="text-lg font-semibold text-brand-navy">Get verified</h1>
    </div>
  );
}
