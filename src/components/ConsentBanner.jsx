import { useState } from "react";

// One-time analytics consent (GDPR/ePrivacy). Writes the flag analytics.js reads.
export default function ConsentBanner() {
  const [shown, setShown] = useState(
    () => typeof localStorage !== "undefined" && !localStorage.getItem("roamr_analytics_consent")
  );
  if (!shown) return null;
  const choose = (v) => { try { localStorage.setItem("roamr_analytics_consent", v); } catch {} setShown(false); };
  return (
    <div className="absolute bottom-0 inset-x-0 z-[60] bg-brand-navy text-white px-4 pt-3 pb-5">
      <p className="text-[13px] leading-snug mb-3">
        We use privacy-friendly analytics to improve ROAMR. You can change this anytime in Settings.
      </p>
      <div className="flex gap-2">
        <button onClick={() => choose("no")} className="flex-1 rounded-lg border border-white/30 py-2.5 text-sm font-semibold">Decline</button>
        <button onClick={() => choose("yes")} className="flex-1 rounded-lg bg-brand-green py-2.5 text-sm font-semibold">Accept</button>
      </div>
    </div>
  );
}
