import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext.jsx";
import { BLOOD_TYPES } from "../lib/safety.js";
import StatusBar from "../components/StatusBar.jsx";

const inputCls = "w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-[15px] outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/30 placeholder:text-muted";
const Lbl = ({ children }) => <p className="text-sm font-semibold text-ink/80 mb-2 mt-5 first:mt-0">{children}</p>;

export default function EmergencyInfo() {
  const nav = useNavigate();
  const { profile, savePrivate } = useAuth();
  const ec = profile?.emergencyContact || {};
  const med = profile?.medical || {};
  const [name, setName] = useState(ec.name || "");
  const [phone, setPhone] = useState(ec.phone || "");
  const [relation, setRelation] = useState(ec.relation || "");
  const [bloodType, setBloodType] = useState(med.bloodType || "");
  const [allergies, setAllergies] = useState(med.allergies || "");
  const [conditions, setConditions] = useState(med.conditions || "");
  const [notes, setNotes] = useState(med.notes || "");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await savePrivate({
        emergencyContact: { name: name.trim(), phone: phone.trim(), relation: relation.trim() },
        medical: { bloodType, allergies: allergies.trim(), conditions: conditions.trim(), notes: notes.trim() },
      });
      setSaved(true); setTimeout(() => nav(-1), 600);
    } finally { setBusy(false); }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <StatusBar />
      <div className="flex items-center gap-3 px-5 py-3 border-b border-black/5">
        <button onClick={() => nav(-1)} aria-label="Back" className="text-brand-navy text-2xl leading-none">‹</button>
        <h1 className="text-lg font-semibold text-brand-navy">Emergency & medical</h1>
      </div>
      <div className="flex-1 px-6 pt-4 overflow-y-auto no-scrollbar">
        <div className="rounded-xl bg-brand-tint p-3 text-[13px] text-ink/75">🔒 Private to you. Only shared on a trip if you turn on "share medical" for that trip.</div>

        <Lbl>Emergency contact</Lbl>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contact name" className={inputCls} />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="Phone number" className={`${inputCls} mt-2`} />
        <input value={relation} onChange={(e) => setRelation(e.target.value)} placeholder="Relationship (e.g. partner, sibling)" className={`${inputCls} mt-2`} />

        <Lbl>Blood type</Lbl>
        <div className="flex flex-wrap gap-2">
          {BLOOD_TYPES.map((b) => (
            <button key={b} onClick={() => setBloodType(bloodType === b ? "" : b)}
              className={`px-3 py-2 rounded-full text-sm font-semibold ${bloodType === b ? "bg-brand-green text-white" : "bg-brand-tint text-brand-navy"}`}>{b}</button>
          ))}
        </div>
        <Lbl>Allergies</Lbl>
        <input value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="e.g. bee stings, penicillin" className={inputCls} />
        <Lbl>Medical conditions</Lbl>
        <input value={conditions} onChange={(e) => setConditions(e.target.value)} placeholder="e.g. asthma, diabetes" className={inputCls} />
        <Lbl>Notes for first responders</Lbl>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={400} placeholder="Anything a responder should know" className={`${inputCls} resize-none`} />
        <div className="h-4" />
      </div>
      <div className="px-6 pb-7 pt-3 border-t border-black/5">
        <button disabled={busy} onClick={save} className="w-full rounded-xl bg-brand-green hover:bg-brand-greenDark text-white font-semibold py-4 disabled:opacity-60">
          {saved ? "Saved ✓" : busy ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
