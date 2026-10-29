import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import StatusBar from "../components/StatusBar.jsx";
import Logo from "../components/Logo.jsx";
import MountainHero from "../components/MountainHero.jsx";
import SocialButtons, { PILL_GREEN } from "../components/AuthButtons.jsx";
import { useAuth } from "../store/AuthContext.jsx";
import { useAuthRedirect, prettyError } from "../lib/authFlow.js";

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const FIELD = "w-full rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md px-4 py-4 text-[15px] text-white outline-none placeholder:text-white/55 focus:border-brand-greenBright focus:ring-2 focus:ring-brand-greenBright/30";

export default function Login() {
  const nav = useNavigate();
  const go = useAuthRedirect();
  const [params] = useSearchParams();
  const { signInEmail, signUpEmail, resetPassword } = useAuth();

  const [mode, setMode] = useState(params.get("mode") === "signup" ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setNotice("");
    if (!isEmail(email)) { setError("Enter a valid email address."); return; }
    if (pw.length < 6) { setError("Password must be at least 6 characters."); return; }
    setBusy("email");
    try {
      const res = mode === "signup" ? await signUpEmail(email.trim(), pw) : await signInEmail(email.trim(), pw);
      go(res);
    } catch (err) {
      setError(prettyError(err.code) || "Something went wrong. Try again.");
      setBusy(null);
    }
  };

  const onForgot = async () => {
    setError(""); setNotice("");
    if (!isEmail(email)) { setError("Enter your email above first."); return; }
    try { await resetPassword(email.trim()); setNotice("Password reset email sent."); }
    catch (err) { setError(prettyError(err.code) || "Could not send reset email."); }
  };

  return (
    <div className="relative h-full w-full text-white">
      <MountainHero soft />
      <div className="relative h-full flex flex-col">
        <StatusBar dark />
        <div className="flex-1 flex flex-col px-6 overflow-y-auto no-scrollbar">
          <button onClick={() => nav("/")} aria-label="Back" className="self-start mt-3 -ml-1 text-white/85 text-3xl leading-none">‹</button>

          <div className="flex flex-col items-center mt-4 mb-7">
            <div className="rounded-[30%] shadow-[0_0_44px_-6px_rgba(125,173,63,0.5)] ring-1 ring-white/15">
              <Logo size={56} showWord={false} />
            </div>
            <h1 className="mt-4 text-[26px] font-extrabold tracking-tight">
              {mode === "signup" ? "Create your account" : "Welcome back"}
            </h1>
            <p className="mt-1 text-white/70 text-[14px]">
              {mode === "signup" ? "Your tribe is out there." : "Good to see you again."}
            </p>
          </div>

          <form onSubmit={submit} noValidate className="space-y-3">
            <input type="email" inputMode="email" autoComplete="email" value={email} aria-label="Email"
              onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={FIELD} />
            <div className="relative">
              <input type={showPw ? "text" : "password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} value={pw}
                aria-label="Password" onChange={(e) => setPw(e.target.value)} placeholder="Password" className={`${FIELD} pr-12`} />
              <button type="button" onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? "Hide password" : "Show password"} aria-pressed={showPw}
                className="absolute inset-y-0 right-0 flex items-center px-4 text-white/60 hover:text-white">
                {showPw ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C5 20 1 12 1 12a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>

            {error && <p role="alert" className="text-[#FFB4A8] text-sm px-1">{error}</p>}
            {notice && <p role="status" className="text-brand-greenBright text-sm px-1">{notice}</p>}

            <button type="submit" disabled={!!busy} className={`${PILL_GREEN} !mt-5`}>
              {busy === "email" ? "One sec…" : mode === "signup" ? "Create account" : "Log in"}
            </button>
          </form>

          <div className="flex justify-between mt-4 text-[13px]">
            <button onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setError(""); setNotice(""); }}
              className="text-brand-greenBright font-semibold">
              {mode === "signup" ? "Have an account? Log in" : "New here? Create account"}
            </button>
            {mode === "signin" && <button onClick={onForgot} className="text-white/70 font-medium">Forgot password?</button>}
          </div>

          <div className="flex items-center gap-3 my-6 text-white/55 text-sm">
            <span className="h-px flex-1 bg-white/15" /> or <span className="h-px flex-1 bg-white/15" />
          </div>
          <div className="space-y-3">
            <SocialButtons busy={busy} setBusy={setBusy} onError={setError} />
          </div>

          <div className="mt-auto pb-7 pt-8 text-center">
            <p className="text-[12px] text-white/60 leading-relaxed">
              By continuing, you agree to our{" "}
              <Link to="/legal/terms" className="text-white/85 underline underline-offset-2">Terms</Link> and{" "}
              <Link to="/legal/privacy" className="text-white/85 underline underline-offset-2">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
