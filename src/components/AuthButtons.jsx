import { Google, Apple } from "./Icons.jsx";
import { useAuth } from "../store/AuthContext.jsx";
import { useAuthRedirect, prettyError } from "../lib/authFlow.js";

// Pill styles for the night-sky auth screens. White = Apple (HIG), frosted = secondary,
// green = ROAMR's own path, outline = quiet.
export const PILL = "w-full h-[52px] rounded-full font-semibold text-[16px] flex items-center justify-center gap-2.5 transition active:scale-[0.99] disabled:opacity-60";
export const PILL_WHITE = `${PILL} bg-white text-brand-navy`;
export const PILL_FROST = `${PILL} bg-white/10 text-white border border-white/15 backdrop-blur-md hover:bg-white/15`;
export const PILL_GREEN = `${PILL} bg-brand-green hover:bg-brand-greenDark text-white shadow-[0_8px_24px_-8px_rgba(125,173,63,0.6)]`;
export const PILL_OUTLINE = `${PILL} border border-white/35 text-white hover:bg-white/5`;

export default function SocialButtons({ busy, setBusy, onError }) {
  const { googleSignIn, appleSignIn } = useAuth();
  const go = useAuthRedirect();
  const run = (fn, method) => async () => {
    onError(""); setBusy(method);
    try { go(await fn(), method); }
    catch (err) { onError(prettyError(err.code) || "Sign-in failed. Try again."); setBusy(null); }
  };
  return (
    <>
      <button onClick={run(appleSignIn, "apple")} disabled={!!busy} className={PILL_WHITE}>
        <Apple className="w-5 h-5" /> {busy === "apple" ? "Connecting…" : "Continue with Apple"}
      </button>
      <button onClick={run(googleSignIn, "google")} disabled={!!busy} className={PILL_FROST}>
        <span className="w-6 h-6 rounded-full bg-white grid place-items-center"><Google className="w-4 h-4" /></span>
        {busy === "google" ? "Connecting…" : "Continue with Google"}
      </button>
    </>
  );
}
