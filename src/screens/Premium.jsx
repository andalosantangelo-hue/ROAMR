import { Info } from "../components/Icons.jsx";
import { useAuth } from "../store/AuthContext.jsx";

const fmtDate = (ts) => {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

export default function Premium() {
  const { profile } = useAuth();
  const sub = profile?.subscription || { tier: "basic", renewsAt: null, amount: null };
  const isPremium = sub.tier === "premium";
  const tierLabel = isPremium ? "Premium" : "Basic";

  return (
    <div className="px-5 pt-6 pb-6 bg-white min-h-full">
      <h1 className="text-center text-xl font-semibold text-brand-navy mb-6">Membership</h1>
      <h2 className="font-bold text-ink/80 mb-3">Your Current Plan</h2>

      <div className="rounded-2xl border border-black/10 p-4">
        <div className="flex items-center gap-3 pb-3 border-b border-black/5">
          <span className="w-11 h-11 rounded-xl bg-brand-tint grid place-items-center text-xl">
            {isPremium ? "⭐" : "🙂"}
          </span>
          <div>
            <div className="text-lg font-bold text-brand-navy">{tierLabel}</div>
            <div className="text-muted text-[13px]">{isPremium ? "Full access to ROAMR" : "Free plan"}</div>
          </div>
        </div>
        <div className="flex justify-between text-[14px] mt-3">
          <span className="text-ink/70">Next Billing Date</span>
          <span className="font-bold text-brand-navy">{isPremium ? fmtDate(sub.renewsAt) : "—"}</span>
        </div>
        <div className="flex justify-between text-[14px] mt-2">
          <span className="text-ink/70">Billing Amount</span>
          <span className="font-bold text-brand-navy">{isPremium && sub.amount ? `$${sub.amount.toFixed(2)}` : "Free"}</span>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl bg-sky-50 text-sky-900 p-4 mt-5 text-[14px]">
        <Info className="w-5 h-5 shrink-0 mt-0.5" />
        <span>Manage your subscription on the app store</span>
      </div>

      {!isPremium && (
        <button className="w-full mt-6 rounded-xl bg-brand-green hover:bg-brand-greenDark transition text-white font-semibold py-4">
          Upgrade to Premium
        </button>
      )}
    </div>
  );
}
