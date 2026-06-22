import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../store/AuthContext.jsx";
import { registerPush } from "../lib/push.js";
import StatusBar from "../components/StatusBar.jsx";
import { ChevronRight, Info } from "../components/Icons.jsx";

export default function Settings() {
  const nav = useNavigate();
  const { user, profile, savePrivate, blockedIds, unblockUser, logout, deleteAccount, exportMyData } = useAuth();
  const [exporting, setExporting] = useState(false);
  const onExport = async () => { setExporting(true); try { await exportMyData(); } finally { setExporting(false); } };
  const prefs = profile?.notificationPrefs || { kudos: true, comments: true, activityJoin: true, tribeMember: true, newFollower: true };
  const togglePref = (k) => savePrivate({ notificationPrefs: { ...prefs, [k]: !prefs[k] } });
  const [pushMsg, setPushMsg] = useState("");
  const enablePush = async () => {
    try { await registerPush(user.uid); setPushMsg("Notifications enabled on this device."); }
    catch (e) { setPushMsg(e.message); }
  };
  const PREF_LABELS = { kudos: "Kudos on your posts", comments: "Comments", activityJoin: "Activity joins", tribeMember: "New tribe members", newFollower: "New followers" };
  const [confirm, setConfirm] = useState(false);
  const [analyticsOn, setAnalyticsOn] = useState(() => typeof localStorage !== "undefined" && localStorage.getItem("roamr_analytics_consent") === "yes");
  const toggleAnalytics = () => { const v = !analyticsOn; setAnalyticsOn(v); try { localStorage.setItem("roamr_analytics_consent", v ? "yes" : "no"); } catch {} };
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onSignOut = async () => { await logout(); nav("/login", { replace: true }); };

  const onDelete = async () => {
    setBusy(true); setError("");
    try { await deleteAccount(); nav("/login", { replace: true }); }
    catch (e) {
      if (e.code === "auth/requires-recent-login")
        setError("For your security, please sign out and sign back in, then delete your account.");
      else setError(e.message || "Could not delete account.");
      setBusy(false);
    }
  };

  const blocked = [...blockedIds];

  return (
    <div className="h-full flex flex-col bg-white">
      <StatusBar />
      <div className="flex items-center gap-3 px-5 py-3">
        <button onClick={() => nav(-1)} className="text-brand-navy text-2xl leading-none">‹</button>
        <h1 className="text-lg font-semibold text-brand-navy">Account Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pt-2 pb-6">
        <section className="mb-7">
          <h2 className="text-sm font-bold text-ink/60 uppercase tracking-wide mb-2">Legal</h2>
          <Link to="/legal/privacy" className="flex items-center gap-3 py-3.5 border-b border-black/5">
            <Info className="w-5 h-5 text-brand-navy" />
            <span className="flex-1 font-semibold text-ink">Privacy Policy</span>
            <ChevronRight className="w-5 h-5 text-muted" />
          </Link>
          <Link to="/legal/terms" className="flex items-center gap-3 py-3.5 border-b border-black/5">
            <Info className="w-5 h-5 text-brand-navy" />
            <span className="flex-1 font-semibold text-ink">Terms of Service</span>
            <ChevronRight className="w-5 h-5 text-muted" />
          </Link>
          <Link to="/legal/accessibility" className="flex items-center gap-3 py-3.5">
            <Info className="w-5 h-5 text-brand-navy" />
            <span className="flex-1 font-semibold text-ink">Accessibility</span>
            <ChevronRight className="w-5 h-5 text-muted" />
          </Link>
          <div className="flex items-center justify-between py-3.5 border-t border-black/5">
            <span className="font-semibold text-ink">Share analytics</span>
            <button onClick={toggleAnalytics} role="switch" aria-checked={analyticsOn} aria-label="Share analytics"
              className={`w-11 h-6 rounded-full transition relative ${analyticsOn ? "bg-brand-green" : "bg-black/15"}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${analyticsOn ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </div>
          <button onClick={onExport} disabled={exporting} className="w-full text-left flex items-center gap-3 py-3.5 border-t border-black/5">
            <Info className="w-5 h-5 text-brand-navy" />
            <span className="flex-1 font-semibold text-ink">{exporting ? "Preparing\u2026" : "Download my data"}</span>
            <ChevronRight className="w-5 h-5 text-muted" />
          </button>
        </section>

        <section className="mb-7">
          <h2 className="text-sm font-bold text-ink/60 uppercase tracking-wide mb-2">Notifications</h2>
          {Object.keys(PREF_LABELS).map((k) => (
            <div key={k} className="flex items-center justify-between py-2.5 border-b border-black/5">
              <span className="text-ink text-[15px]">{PREF_LABELS[k]}</span>
              <button onClick={() => togglePref(k)} role="switch" aria-checked={prefs[k] !== false} aria-label={PREF_LABELS[k]}
                className={`w-11 h-6 rounded-full transition relative ${prefs[k] !== false ? "bg-brand-green" : "bg-black/15"}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${prefs[k] !== false ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </div>
          ))}
          <button onClick={enablePush} className="mt-3 text-brand-green font-semibold text-sm">Enable push on this device</button>
          {pushMsg && <p className="text-muted text-[12px] mt-1">{pushMsg}</p>}
        </section>

        <section className="mb-7">
          <h2 className="text-sm font-bold text-ink/60 uppercase tracking-wide mb-2">Blocked Accounts</h2>
          {blocked.length === 0 ? (
            <p className="text-muted text-sm py-2">You haven&apos;t blocked anyone.</p>
          ) : (
            <div className="divide-y divide-black/5">
              {blocked.map((id) => (
                <div key={id} className="flex items-center justify-between py-3">
                  <span className="text-ink text-sm truncate">{id.slice(0, 10)}…</span>
                  <button onClick={() => unblockUser(id)} className="text-brand-green font-semibold text-sm">Unblock</button>
                </div>
              ))}
            </div>
          )}
        </section>

        <button onClick={onSignOut}
          className="w-full rounded-xl border border-black/10 text-ink font-semibold py-3.5 active:scale-[0.99] transition mb-3">
          Sign out
        </button>

        {!confirm ? (
          <button onClick={() => setConfirm(true)}
            className="w-full rounded-xl border border-red-200 text-red-600 font-semibold py-3.5 active:scale-[0.99] transition">
            Delete account
          </button>
        ) : (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-red-700 text-sm font-medium">This permanently deletes your account and content. This can&apos;t be undone.</p>
            {error && <p className="text-red-700 text-sm mt-2">{error}</p>}
            <div className="flex gap-2 mt-3">
              <button onClick={() => setConfirm(false)} className="flex-1 rounded-lg border border-black/10 py-2.5 text-sm font-semibold">Cancel</button>
              <button onClick={onDelete} disabled={busy} className="flex-1 rounded-lg bg-red-600 text-white py-2.5 text-sm font-semibold disabled:opacity-60">
                {busy ? "Deleting…" : "Delete forever"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
