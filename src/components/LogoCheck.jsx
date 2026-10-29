import { useEffect, useState } from "react";
import Logo from "./Logo.jsx";
import { Check } from "./Icons.jsx";

// ROAMR mark with a green check that pops in when `checked` turns true.
// Used for the 18+ confirmation moment — not an identity-verification badge.
export default function LogoCheck({ size = 88, checked = false }) {
  const [pop, setPop] = useState(false);
  useEffect(() => {
    if (!checked) { setPop(false); return undefined; }
    const t = requestAnimationFrame(() => setPop(true));
    return () => cancelAnimationFrame(t);
  }, [checked]);
  const badge = Math.round(size * 0.42);

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <Logo size={size} showWord={false} />
      {checked && (
        <span
          aria-hidden="true"
          style={{ width: badge, height: badge, right: -badge * 0.25, bottom: -badge * 0.25 }}
          className={`absolute rounded-full bg-brand-green text-white grid place-items-center ring-4 ring-white shadow-lg
            motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out
            ${pop ? "scale-100" : "motion-safe:scale-0"}`}>
          <Check className="w-3/5 h-3/5" strokeWidth={3} />
        </span>
      )}
    </div>
  );
}
