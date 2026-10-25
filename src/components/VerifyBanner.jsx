import { useState } from "react";
import { useAuth } from "../store/AuthContext.jsx";
import { auth } from "../lib/firebase.js";

// True when an email/password account hasn't confirmed its address yet.
// Social sign-ins (Google/Apple) are already verified by the provider.
export function useNeedsVerify() {
  const { user } = useAuth();
  return !!(user && !user.emailVerified &&
    (user.providerData || []).some((p) => p.providerId === "password"));
}

function MailIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" />
    </svg>
  );
}

// Friendly, dismissible-by-design verification card. Lives in the
// Notification center and on the Profile tab — never on the main feeds.
// variant="row" renders a compact list row for the Profile menu.
export default function VerifyCard({ variant = "card" }) {
  const { user, resendVerification } = useAuth();
  const needs = useNeedsVerify();
  const [state, setState] = useState("idle"); // idle | sending | sent | checking | done | error
  if (!needs || state === "done") return null;

  const resend = async () => {
    setState("sending");
    try { await resendVerification(); setState("sent"); } catch { setState("error"); }
  };
  const check = async () => {
    setState("checking");
    try {
      await auth.currentUser?.reload();
      setState(auth.currentUser?.emailVerified ? "done" : "sent");
    } catch { setState("error"); }
  };

  if (variant === "row") {
    return (
      <div className="flex items-center gap-4 py-4">
        <span className="w-10 h-10 rounded-full bg-brand-tint text-brand-green grid place-items-center shrink-0">
          <MailIcon className="w-5 h-5" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-ink">Confirm your email</div>
          <div className="text-muted text-[13px]">
            {state === "sent" ? "Link sent — check your inbox" : "Keeps your account recoverable"}
          </div>
        </div>
        <button onClick={state === "sent" ? check : resend} disabled={state === "sending" || state === "checking"}
          className="min-h-[44px] px-4 rounded-full bg-brand-green text-white text-[13px] font-semibold disabled:opacity-60">
          {state === "sending" ? "Sending…" : state === "checking" ? "Checking…" : state === "sent" ? "I've confirmed" : "Send link"}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-4 my-3 rounded-2xl bg-gradient-to-br from-brand-tint to-white ring-1 ring-brand-green/15 p-4 flex gap-3">
      <span className="w-11 h-11 rounded-full bg-white shadow-card text-brand-green grid place-items-center shrink-0">
        <MailIcon className="w-5 h-5" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-brand-navy">One quick thing 👋</p>
        <p className="text-[13px] text-muted mt-0.5">
          Confirm {user?.email ? <span className="text-ink font-medium break-all">{user.email}</span> : "your email"} so you can always get back into your account.
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <button onClick={resend} disabled={state === "sending"}
            className="min-h-[40px] px-4 rounded-full bg-brand-green text-white text-[13px] font-semibold disabled:opacity-60">
            {state === "sending" ? "Sending…" : state === "sent" ? "Sent ✓ Resend" : "Send me the link"}
          </button>
          <button onClick={check} disabled={state === "checking"}
            className="min-h-[40px] px-4 rounded-full bg-white ring-1 ring-black/10 text-brand-navy text-[13px] font-semibold">
            {state === "checking" ? "Checking…" : "I've confirmed"}
          </button>
        </div>
        {state === "error" && <p className="text-[12px] text-red-600 mt-2">Couldn't reach the server — try again in a moment.</p>}
      </div>
    </div>
  );
}
