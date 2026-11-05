import { useNavigate } from "react-router-dom";

// Empty screen with a way out: icon tile, one-line title, short body and up to two
// actions. A bare "Nothing here" line is a dead end for a brand-new user, so every
// empty list should say what to do next. `actions`: [{ label, to } | { label, onClick }],
// first one is the primary button.
export default function EmptyState({ Icon, title, body, actions = [], className = "" }) {
  const nav = useNavigate();
  return (
    <div className={`flex flex-col items-center text-center px-8 ${className}`}>
      {Icon && (
        <span className="w-16 h-16 rounded-2xl bg-brand-navy text-brand-greenBright grid place-items-center mb-4">
          <Icon className="w-8 h-8" />
        </span>
      )}
      <h2 className="text-lg font-extrabold text-brand-navy mb-1">{title}</h2>
      {body && <p className="text-muted text-sm max-w-[280px]">{body}</p>}
      {actions.length > 0 && (
        <div className="mt-5 flex flex-col gap-2 w-full max-w-[260px]">
          {actions.map((a, i) => (
            <button key={a.label} type="button"
              onClick={() => (a.onClick ? a.onClick() : nav(a.to))}
              className={i === 0
                ? "min-h-[44px] rounded-xl bg-brand-green hover:bg-brand-greenDark text-white font-semibold text-sm transition"
                : "min-h-[44px] rounded-xl bg-white text-brand-navy font-semibold text-sm shadow-card"}>
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
