import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import StatusBar from "../components/StatusBar.jsx";
import Logo from "../components/Logo.jsx";
import { Google, Apple } from "../components/Icons.jsx";
import { useAuth } from "../store/AuthContext.jsx";
import { track } from "../lib/analytics.js";

const PRIVACY_URL = "https://roamr.app/privacy";
const TERMS_URL = "https://roamr.app/terms";
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export default function Login() {
  const nav = useNavigate();
  const from = useLocation().state?.from;
  const { signInEmail, signUpEmail, googleSignIn, appleSignIn, resetPassword } = useAuth();

  const [mode, setMode] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dob, setDob] = useState("");
  const ageFrom = (d) => { const b = new Date(d), t = new Date(); let a = t.getFullYear() - b.getFullYear(); const m = t.getMonth() - b.getMonth(); if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--; return a; };

  const go = ({ isNew }, method = "email") => {
    track(isNew ? "sign_up" : "login", { method });
    nav(isNew ? "/onboarding" : (from || "/app/home"));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setNotice("");
    if (!isEmail(email)) { setError("Enter a valid email address."); return; }
    if (pw.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (mode === "signup") {
      if (!dob) { setError("Please enter your date of birth."); return; }
      if (ageFrom(dob) < 13) { setError("You must be at least 13 years old to use ROAMR."); return; }
    }
    setBusy(true);
    try {
      const res = mode === "signup" ? await signUpEmail(email.trim(), pw) : await signInEmail(email.trim(), pw);
      go(res);
    } catch (err) {
      setError(prettyError(err.code) || "Something went wrong. Try again.");
      setBusy(false);
    }
  };

  const social = (fn, method) => async () => {
    setError(""); setBusy(true);
    try { go(await fn(), method); }
    catch (err) { setError(prettyError(err.code) || "Sign-in failed."); setBusy(false); }
  };

  const onForgot = async () => {
    setError(""); setNotice("");
    if (!isEmail(email)) { setError("Enter your email above first."); return; }
    try { await resetPassword(email.trim()); setNotice("Password reset email sent."); }
    catch (err) { setError(prettyError(err.code) || "Could not send reset email."); }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-brand-tint to-white">
      <StatusBar />
      <div className="flex-1 flex flex-col px-6 overflow-y-auto no-scrollbar">
        <div className="flex flex-col items-center mt-14 mb-7">
          <Logo size={64} showWord={false} />
          <span className="mt-3 text-2xl font-extrabold tracking-tight text-brand-navy">ROAMR</span>
        </div>

        <p className="text-center text-ink/80 text-[15px] mb-5">
          {mode === "signup" ? "Create your account to find your tribe." : "Welcome back."}
        </p>

        <form onSubmit={submit} className="space-y-3">
          <input type="email" inputMode="email" autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="Email"
            className="w-full rounded-xl border border-black/10 bg-white px-4 py-4 text-[15px] outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/30 placeholder:text-muted" />
          <input type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} value={pw}
            onChange={(e) => setPw(e.target.value)} placeholder="Password"
            className="w-full rounded-xl border border-black/10 bg-white px-4 py-4 text-[15px] outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/30 placeholder:text-muted" />
          {mode === "signup" && (
            <div>
              <label className="block text-[13px] text-ink/70 mb-1 ml-1">Date of birth (you must be 13+)</label>
              <input type="date" value={dob} onChange={(e) => setDob(e.target.value)}
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-[15px] outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/30 text-ink" />
            </div>
          )}
          <button type="submit" disabled={busy}
            className="w-full rounded-xl bg-brand-green hover:bg-brand-greenDark transition text-white font-semibold py-4 disabled:opacity-60">
            {busy ? "…" : mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>

        <div className="flex justify-between mt-3 text-[13px]">
          <button onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setError(""); }}
            className="text-brand-green font-semibold">
            {mode === "signup" ? "Have an account? Sign in" : "New here? Create account"}
          </button>
          {mode === "signin" && <button onClick={onForgot} className="text-muted font-medium">Forgot password?</button>}
        </div>

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

        {error && <p className="text-red-600 text-sm mt-4 text-center">{error}</p>}
        {notice && <p className="text-brand-green text-sm mt-4 text-center">{notice}</p>}

        <div className="mt-auto pb-7 pt-8 text-center">
          <p className="text-[13px] text-ink/70 leading-relaxed">
            By continuing, you agree to our{" "}
            <a href={TERMS_URL} target="_blank" rel="noreferrer" className="text-brand-green font-medium">Terms of Service</a>{" "}and{" "}
            <a href={PRIVACY_URL} target="_blank" rel="noreferrer" className="text-brand-green font-medium">Privacy Policy</a>.
          </p>
          <p className="text-[12px] text-muted mt-2">Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
}

function prettyError(code) {
  const m = {
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/wrong-password": "Incorrect password.",
    "auth/user-not-found": "No account with that email — try Create account.",
    "auth/email-already-in-use": "That email already has an account — sign in instead.",
    "auth/weak-password": "Choose a stronger password (6+ characters).",
    "auth/popup-closed-by-user": "Sign-in cancelled.",
    "auth/operation-not-allowed": "This sign-in method isn't enabled yet in Firebase.",
    "auth/too-many-requests": "Too many attempts. Please wait and try again.",
    "auth/network-request-failed": "Network error — check your connection.",
  };
  return m[code];
}
