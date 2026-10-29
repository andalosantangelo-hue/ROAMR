import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import StatusBar from "../components/StatusBar.jsx";
import Logo from "../components/Logo.jsx";
import MountainHero from "../components/MountainHero.jsx";
import SocialButtons, { PILL_GREEN, PILL_OUTLINE } from "../components/AuthButtons.jsx";

// Welcome: brand up top, every way in at the bottom — social sign-in starts right here.
export default function Splash() {
  const nav = useNavigate();
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  return (
    <div className="relative h-full w-full text-white">
      <MountainHero />
      <div className="relative h-full flex flex-col">
        <StatusBar dark />

        <div className="relative flex-1 flex flex-col items-center justify-center px-6 pb-16">
          {/* soft dark halo so the brand stays legible over bright sky */}
          <div aria-hidden="true" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[58%] w-[130%] aspect-square rounded-full bg-[radial-gradient(closest-side,rgba(10,22,32,0.62),rgba(10,22,32,0.28)_55%,transparent)]" />
          <div className="relative rounded-[30%] shadow-[0_0_60px_-6px_rgba(125,173,63,0.55)] ring-1 ring-white/15">
            <Logo size={84} showWord={false} />
          </div>
          <h1 className="relative mt-5 text-[40px] leading-none font-extrabold tracking-tight [text-shadow:0_2px_16px_rgba(0,0,0,0.55)]">ROAMR</h1>
          <p className="relative mt-3 text-white/90 text-[15px] font-medium [text-shadow:0_1px_10px_rgba(0,0,0,0.7)]">
            Find your tribe. <span className="text-brand-greenBright font-semibold">Get outside.</span>
          </p>
        </div>

        <div className="px-6 pb-8 space-y-3">
          <SocialButtons busy={busy} setBusy={setBusy} onError={setError} />
          <button onClick={() => nav("/login?mode=signup")} disabled={!!busy} className={PILL_GREEN}>
            Sign up with email
          </button>
          <button onClick={() => nav("/login")} disabled={!!busy} className={PILL_OUTLINE}>
            Log in
          </button>

          {error && <p role="alert" className="text-[#FFB4A8] text-sm text-center pt-1">{error}</p>}

          <p className="text-[12px] text-white/60 text-center leading-relaxed pt-2">
            By continuing, you agree to our{" "}
            <Link to="/legal/terms" className="text-white/85 underline underline-offset-2">Terms</Link> and{" "}
            <Link to="/legal/privacy" className="text-white/85 underline underline-offset-2">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
