import { useState } from "react";
import { useAuth } from "../store/AuthContext.jsx";

export default function VerifyBanner() {
  const { user, resendVerification } = useAuth();
  const [sent, setSent] = useState(false);
  const needs = user && !user.emailVerified && (user.providerData || []).some((p) => p.providerId === "password");
  if (!needs) return null;
  return (
    <div className="bg-amber-50 text-amber-800 text-[13px] px-4 py-2 flex items-center justify-between gap-3">
      <span>Verify your email to secure your account.</span>
      <button onClick={async () => { try { await resendVerification(); setSent(true); } catch {} }}
        className="font-semibold underline shrink-0">{sent ? "Sent ✓" : "Resend"}</button>
    </div>
  );
}
