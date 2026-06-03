import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import StatusBar from "../components/StatusBar.jsx";
import Logo from "../components/Logo.jsx";
import { Google, Apple } from "../components/Icons.jsx";
import { useAuth } from "../store/AuthContext.jsx";
import { track } from "../lib/analytics.js";

const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export default function Login() {
  const nav = useNavigate();
  const from = useLocation().state?.from;
  const { emailMethods, signInEmail, signUpEmail, googleSignIn, appleSignIn, resetPassword } = useAuth();

  const [step, setStep] = useState("email"); // email | password
  const [mode, setMode] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const go = ({ isNew }, method = "email") => { track(isNew ? "sign_up" : "login", { method }); nav(isNew ? "/onboarding" : (from || "/app/home")); };

  const onContinueEmail = async (e) => {
    e.preventDefault();
    setError("");
    const v = email.trim();
    if (!isEmail(v)) { setError("Enter a valid email. (Phone sign-in is coming soon.)"); return; }
    setBusy(true);
    try {
      const methods = await emailMethods(v);
      setMode(methods.includes("password") || methods.length ? "signin" : "signup");
      setStep("password");
    } catch (err) {
      setError(err.message);
    } finally { setBusy(false); }
  };

  const onSubmitPassword = async (e) => {
    e.preventDefault();
    setError("");
    if (pw.length < 6) { setError("Password must be at least 6 characters."); return; }
    setBusy(true);
    try {
      const res = mode === "signup"
        ? await signUpEmail(email.trim(), pw)
        : await signInEmail(email.trim(), pw);
      go(res);
    } catch (err) {
      setError(prettyError(err.code) || err.message);
      setBusy(false);
    }
  };

  const social = (fn, method) => async () => {
    setError(""); setBusy(true);
    try { go(await fn(), method); }
    catch (err) { setError(prettyError(err.code) || err.message); setBusy(false); }
  };

  const onForgot = async () => {
    setError(""); setNotice("");
    try { await resetPassword(email.trim()); setNotice("Password reset email sent."); }
    catch (err) { setError(prettyError(err.code) || err.message); }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-brand-tint to-white">
      <StatusBar />
      <div className="flex-1 flex flex-col px-6">
        <div className="flex flex-col items-center mt-16 mb-8">
          <Logo size={68} showWord={false} />
          <span className="mt-3 text-2xl font-extrabold tracking-tight text-brand-navy">ROAMR</span>
        </div>

        {step === "email" ? (
          <>
            <p className="text-center text-ink/80 text-[15px] leading-relaxed mb-6">
              Enter your email. If you don&apos;t have an account we&apos;ll create one.
            </p>
            <form onSubmit={onContinueEmail}>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-4 text-[15px] outline-none
                           focus:border-brand-green focus:ring-2 focus:ring-brand-green/30 placeholder:text-muted" />
              <button type="submit" disabled={busy}
                className="mt-3 w-full rounded-xl bg-brand-green hover:bg-brand-greenDark transition text-white font-semibold py-4 disabled:opacity-60">
                {busy ? "…" : "Continue"}
              </button>
            </form>

            <div className="flex items-center gap-3 my-6 text-muted text-sm">
              <span className="h-px flex-1 bg-black/10" /> Or <span className="h-px flex-1 bg-black/10" />
            </div>
            <button onClick={social(googleSignIn, "google")} disabled={busy}
              className="w-full rounded-xl border border-black/10 bg-white py-3.5 font-semibold text-ink flex items-center justify-center gap-3 mb-3 active:scale-[0.99] transition">
              <Google /> Continue with Google
            </button>
            <button onClick={social(appleSignIn, "apple")} disabled={busy}
              className="w-full rounded-xl border border-black/10 bg-white py-3.5 font-semibold text-ink flex items-center justify-center gap-3 active:scale-[0.99] transition">
              <Apple className="w-5 h-5" /> Continue with Apple
            </button>
          </>
        ) : (
          <>
            <p className="text-center text-ink/80 text-[15px] mb-1">
              {mode === "signup" ? "Create a password for" : "Welcome back"}
            </p>
            <p className="text-center text-brand-navy font-semibold mb-6">{email}</p>
            <form onSubmit={onSubmitPassword}>
              <input
                type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus
                placeholder={mode === "signup" ? "Create a password" : "Your password"}
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-4 text-[15px] outline-none
                           focus:border-brand-green focus:ring-2 focus:ring-brand-green/30 placeholder:text-muted" />
              <button type="submit" disabled={busy}
                className="mt-3 w-full rounded-xl bg-brand-green hover:bg-brand-greenDark transition text-white font-semibold py-4 disabled:opacity-60">
                {busy ? "…" : mode === "signup" ? "Create account" : "Sign in"}
              </button>
            </form>
            <div className="flex justify-between mt-4 text-[13px]">
              <button onClick={() => { setStep("email"); setPw(""); setError(""); }} className="text-muted font-medium">‹ Change email</button>
              {mode === "signin" && <button onClick={onForgot} className="text-brand-green font-semibold">Forgot password?</button>}
            </div>
          </>
        )}

        {error && <p className="text-red-600 text-sm mt-4 text-center">{error}</p>}
        {notice && <p className="text-brand-green text-sm mt-4 text-center">{notice}</p>}

        <div className="mt-auto pb-7 pt-8 text-center">
          <p className="text-[13px] text-ink/70 leading-relaxed">
            By continuing, you agree to our<br />
            <span className="text-brand-green font-medium">Terms of Service</span> and{" "}
            <span className="text-brand-green font-medium">Privacy Policy.</span>
          </p>
          <p className="text-[12px] text-muted mt-2">Version 12.4.2</p>
        </div>
      </div>
    </div>
  );
}

function prettyError(code) {
  const m = {
    "auth/wrong-password": "Incorrect password.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/email-already-in-use": "That email already has an account — sign in instead.",
    "auth/popup-closed-by-user": "Sign-in cancelled.",
    "auth/operation-not-allowed": "This sign-in method isn't enabled yet in Firebase.",
    "auth/too-many-requests": "Too many attempts. Try again shortly.",
  };
  return m[code];
}
