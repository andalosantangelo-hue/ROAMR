import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import StatusBar from "../components/StatusBar.jsx";
import Logo from "../components/Logo.jsx";
import NightSky from "../components/NightSky.jsx";
import SocialButtons, { PILL_GREEN, PILL_OUTLINE } from "../components/AuthButtons.jsx";

// Welcome: brand up top, every way in at the bottom — social sign-in starts right here.
export default function Splash() {
  const nav = useNavigate();
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  return (
    <div className="relative h-full w-full text-white">
      <NightSky />
      <div className="relative h-full flex flex-col">
        <StatusBar dark />

        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10">
          <div className="rounded-[30%] shadow-[0_0_60px_-6px_rgba(125,173,63,0.55)] ring-1 ring-white/15">
            <Logo size={84} showWord={false} />
          </div>
          <h1 className="mt-5 text-[40px] leading-none font-extrabold tracking-tight">ROAMR</h1>
          <p className="mt-3 text-white/75 text-[15px]">
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
