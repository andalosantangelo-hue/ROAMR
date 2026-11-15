import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext.jsx";
import StatusBar from "../components/StatusBar.jsx";
import { Check } from "../components/Icons.jsx";
import { GUIDE_SPECIALTIES, GUIDE_LIMITS, validateGuideApplication, submitGuideApplication, watchGuideApplication, guideBadge } from "../lib/guide.js";
import { track } from "../lib/analytics.js";

const inputCls = "w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-[15px] outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/30 placeholder:text-muted";
const EMPTY = { fullName: "", specialties: [], region: "", experienceYears: "", certifications: "", license: "", insuranceProvider: "", insurancePolicy: "", insuranceExpires: "", website: "", bio: "" };

function Field({ id, label, hint, error, children }) {
  return (
    <div className="mt-5 first:mt-0">
      <label htmlFor={id} className="block text-sm font-semibold text-ink/80 mb-2">{label}</label>
      {children}
      {hint && !error && <p className="text-muted text-[12px] mt-1">{hint}</p>}
      {error && <p id={`${id}-err`} className="text-red-600 text-[13px] mt-1">{error}</p>}
    </div>
  );
}

export default function GuideApply() {
  const nav = useNavigate();
  const { user, profile } = useAuth();
  const [app, setApp] = useState(undefined); // undefined = loading, null = none yet
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => (user ? watchGuideApplication(user.uid, setApp) : undefined), [user]);
  // Prefill from a previous (e.g. rejected) application so a resubmit isn't from scratch.
  useEffect(() => {
    if (app && !editing) setForm({ ...EMPTY, ...app, experienceYears: String(app.experienceYears ?? "") });
  }, [app, editing]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggle = (s) => setForm((f) => ({
    ...f, specialties: f.specialties.includes(s) ? f.specialties.filter((x) => x !== s) : [...f.specialties, s],
  }));

  const submit = async () => {
    const r = validateGuideApplication(form);
    setErrors(r.errors); setError("");
    if (!r.ok) { setError("Check the highlighted fields."); return; }
    if (!confirmed) { setError("Confirm your details are accurate to submit."); return; }
    setBusy(true);
    try {
      await submitGuideApplication(user.uid, r.data);
      track("guide_application_submitted", { specialties: r.data.specialties.length });
      setEditing(false);
    } catch { setError("Your application couldn't be sent. Check your connection and try again."); }
    finally { setBusy(false); }
  };

  const badge = guideBadge(profile);
  const status = app?.status;
  const showForm = app === null || status === "rejected" || editing;

  return (
    <div className="h-full flex flex-col bg-white">
      <StatusBar />
      <div className="flex items-center gap-3 px-5 py-3 border-b border-black/5">
        <button onClick={() => nav(-1)} aria-label="Back" className="text-brand-navy text-2xl leading-none">‹</button>
        <h1 className="text-lg font-semibold text-brand-navy">Become a verified guide</h1>
      </div>

      <div className="flex-1 px-6 pt-4 pb-6 overflow-y-auto no-scrollbar">
        {app === undefined ? (
          <p className="text-muted text-sm" role="status">Loading…</p>
        ) : badge || status === "approved" ? (
          <StatusCard tone="good" title="You're a verified guide"
            body={`Your profile shows "${badge || "Verified guide"}". To change your licence, insurance or specialties, contact support from the Help Center.`} />
        ) : status === "pending" && !editing ? (
          <StatusCard tone="wait" title="Application under review"
            body="We check your licence, permits and insurance before approving. You'll get a notification when it's done." />
        ) : null}

        {status === "rejected" && !editing && (
          <div className="rounded-xl bg-red-50 text-red-700 text-[14px] p-3 mb-4">
            We couldn't approve your application yet. Check your licence and insurance details below, then resubmit.
          </div>
        )}

        {showForm && (
          <>
            <p className="text-ink/80 text-[15px] leading-relaxed">
              Guide on your own terms. Verified guides get a badge on their profile, so people know their guide is licensed and insured.
              Paid trip listings, where you set the price, are coming next.
            </p>
            <div className="rounded-xl bg-brand-tint p-3 text-[13px] text-ink/75 mt-4">
              🔒 Your licence and insurance details are private. Only the ROAMR team reviewing your application sees them. Your profile shows only your specialties and region.
            </div>

            <div className="mt-5">
              <Field id="g-name" label="Full legal name" error={errors.fullName}>
                <input id="g-name" value={form.fullName} onChange={set("fullName")} maxLength={GUIDE_LIMITS.fullName} autoComplete="name" className={inputCls} aria-invalid={!!errors.fullName} />
              </Field>

              <div className="mt-5">
                <p className="text-sm font-semibold text-ink/80 mb-2" id="g-spec-label">What do you guide?</p>
                <div className="flex flex-wrap gap-2" role="group" aria-labelledby="g-spec-label">
                  {GUIDE_SPECIALTIES.map((s) => {
                    const on = form.specialties.includes(s);
                    return (
                      <button key={s} type="button" aria-pressed={on} onClick={() => toggle(s)}
                        className={`px-3.5 py-2 rounded-full text-sm font-semibold ${on ? "bg-brand-green text-white" : "bg-brand-tint text-brand-navy"}`}>{s}</button>
                    );
                  })}
                </div>
                {errors.specialties && <p className="text-red-600 text-[13px] mt-1">{errors.specialties}</p>}
              </div>

              <Field id="g-region" label="Where you guide" hint="Town, river or area, e.g. Madison River, Bozeman MT" error={errors.region}>
                <input id="g-region" value={form.region} onChange={set("region")} maxLength={GUIDE_LIMITS.region} className={inputCls} aria-invalid={!!errors.region} />
              </Field>
              <Field id="g-years" label="Years guiding" error={errors.experienceYears}>
                <input id="g-years" value={form.experienceYears} onChange={set("experienceYears")} inputMode="numeric" className={inputCls} aria-invalid={!!errors.experienceYears} />
              </Field>
              <Field id="g-license" label="Guide licence or permit" hint="Number and issuing state or agency, e.g. MT Outfitter Guide #12345" error={errors.license}>
                <input id="g-license" value={form.license} onChange={set("license")} maxLength={GUIDE_LIMITS.license} className={inputCls} aria-invalid={!!errors.license} />
              </Field>
              <Field id="g-ins" label="Liability insurance provider" error={errors.insuranceProvider}>
                <input id="g-ins" value={form.insuranceProvider} onChange={set("insuranceProvider")} maxLength={GUIDE_LIMITS.insuranceProvider} className={inputCls} aria-invalid={!!errors.insuranceProvider} />
              </Field>
              <Field id="g-pol" label="Policy number" error={errors.insurancePolicy}>
                <input id="g-pol" value={form.insurancePolicy} onChange={set("insurancePolicy")} maxLength={GUIDE_LIMITS.insurancePolicy} className={inputCls} aria-invalid={!!errors.insurancePolicy} />
              </Field>
              <Field id="g-exp" label="Policy expires" error={errors.insuranceExpires}>
                <input id="g-exp" type="date" value={form.insuranceExpires} onChange={set("insuranceExpires")} className={inputCls} aria-invalid={!!errors.insuranceExpires} />
              </Field>
              <Field id="g-cert" label="Certifications (optional)" hint="e.g. Wilderness First Responder, AMGA, Orvis-endorsed" error={errors.certifications}>
                <textarea id="g-cert" value={form.certifications} onChange={set("certifications")} rows={2} maxLength={GUIDE_LIMITS.certifications} className={`${inputCls} resize-none`} />
              </Field>
              <Field id="g-web" label="Website or Instagram (optional)" error={errors.website}>
                <input id="g-web" value={form.website} onChange={set("website")} inputMode="url" placeholder="https://" maxLength={GUIDE_LIMITS.website} className={inputCls} aria-invalid={!!errors.website} />
              </Field>
              <Field id="g-bio" label="About your trips (optional)" error={errors.bio}>
                <textarea id="g-bio" value={form.bio} onChange={set("bio")} rows={3} maxLength={GUIDE_LIMITS.bio} className={`${inputCls} resize-none`} />
              </Field>

              <label className="flex gap-3 items-start mt-6 text-[14px] text-ink/80">
                <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-1 w-5 h-5 accent-brand-green" />
                <span>These details are accurate, and I hold the licences, permits and insurance required where I guide.</span>
              </label>
            </div>
          </>
        )}

        {status === "pending" && !editing && (
          <button onClick={() => setEditing(true)} className="mt-4 text-brand-green font-semibold text-sm">Edit application</button>
        )}
      </div>

      {showForm && (
        <div className="px-6 pb-7 pt-3 border-t border-black/5">
          {error && <p role="alert" className="text-red-600 text-sm mb-3">{error}</p>}
          <button disabled={busy} onClick={submit} className="w-full rounded-xl bg-brand-green hover:bg-brand-greenDark text-white font-semibold py-4 disabled:opacity-60">
            {busy ? "Sending…" : status === "rejected" || editing ? "Resubmit application" : "Submit application"}
          </button>
        </div>
      )}
    </div>
  );
}

function StatusCard({ tone, title, body }) {
  return (
    <div className={`rounded-2xl p-5 text-center ${tone === "good" ? "bg-brand-tint" : "bg-brand-navy text-white"}`}>
      <span className={`w-14 h-14 rounded-full grid place-items-center mx-auto mb-3 ${tone === "good" ? "bg-brand-green text-white" : "bg-white/15 text-brand-greenBright"}`}>
        <Check className="w-7 h-7" />
      </span>
      <h2 className={`text-lg font-extrabold ${tone === "good" ? "text-brand-navy" : ""}`}>{title}</h2>
      <p className={`text-sm mt-1 ${tone === "good" ? "text-ink/75" : "text-white/80"}`}>{body}</p>
    </div>
  );
}
