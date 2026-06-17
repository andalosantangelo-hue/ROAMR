import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, auth } from "../lib/firebase.js";
import { useAuth } from "../store/AuthContext.jsx";
import { compressImage } from "../lib/image.js";
import { titleCase } from "../lib/util.js";
import {
  MAX_PHOTOS, MAX_PROMPTS, PROMPT_MAXLEN, PROMPTS, STYLE, PACE, AVAILABILITY, TRAVEL,
  CERTS, GEAR, LOOKING_FOR, ACTIVITIES, SKILLS, completeness,
} from "../lib/profile.js";
import StatusBar from "../components/StatusBar.jsx";
import { Profile as UserIcon, Plus, Check } from "../components/Icons.jsx";

function Seg({ options, value, onChange }) {
  return (
    <div className="flex rounded-xl border border-black/10 overflow-hidden">
      {options.map((o) => (
        <button key={o.id} type="button" onClick={() => onChange(value === o.id ? "" : o.id)}
          className={`flex-1 py-2.5 text-[13px] font-semibold transition ${value === o.id ? "bg-brand-green text-white" : "bg-white text-ink"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
function Chips({ options, values, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const id = typeof o === "string" ? o : o.id;
        const label = typeof o === "string" ? o : o.label;
        const on = values.includes(id);
        return (
          <button key={id} type="button" onClick={() => onToggle(id)}
            className={`px-3.5 py-2 rounded-full text-sm font-semibold transition ${on ? "bg-brand-green text-white" : "bg-brand-tint text-brand-navy"}`}>
            {label}
          </button>
        );
      })}
    </div>
  );
}
const Label = ({ children }) => (
  <p className="text-sm font-semibold text-ink/80 mb-2 mt-6">{children}</p>
);

export default function EditProfile() {
  const nav = useNavigate();
  const { user, profile, saveProfile } = useAuth();
  const fileRef = useRef(null);

  const [name, setName] = useState(profile?.displayName || user?.displayName || "");
  const [location, setLocation] = useState(profile?.location || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const initPhotos = (profile?.photos && profile.photos.length ? profile.photos : (profile?.photoURL ? [profile.photoURL] : []))
    .map((url) => ({ url }));
  const [photos, setPhotos] = useState(initPhotos);
  const [interests, setInterests] = useState(Array.isArray(profile?.interests) ? profile.interests : []);
  const [skillLevels, setSkillLevels] = useState({ ...(profile?.skillLevels || {}) });
  const [prompts, setPrompts] = useState(Array.isArray(profile?.prompts) ? profile.prompts : []);
  const [style, setStyle] = useState(profile?.style || "");
  const [pace, setPace] = useState(profile?.pace || "");
  const [willTravel, setWillTravel] = useState(profile?.willTravel || "");
  const [availability, setAvailability] = useState(profile?.availability || []);
  const [lookingFor, setLookingFor] = useState(profile?.lookingFor || []);
  const [certifications, setCertifications] = useState(profile?.certifications || []);
  const [gearShare, setGearShare] = useState(profile?.gearShare || []);
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const tog = (setter) => (id) => setter((arr) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]));
  const toggleInterest = (id) => setInterests((a) => a.includes(id) ? a.filter((x) => x !== id) : [...a, id]);
  const setSkill = (id, lvl) => setSkillLevels((m) => ({ ...m, [id]: lvl }));

  const addPhotos = (e) => {
    const files = Array.from(e.target.files || []);
    setPhotos((p) => [...p, ...files.map((f) => ({ file: f, url: URL.createObjectURL(f), isNew: true }))].slice(0, MAX_PHOTOS));
  };
  const removePhoto = (i) => setPhotos((p) => p.filter((_, idx) => idx !== i));

  const usedQs = prompts.map((p) => p.q);
  const addPrompt = (q) => { setPrompts((p) => [...p, { q, a: "" }]); setPicker(false); };
  const setAnswer = (i, a) => setPrompts((p) => p.map((x, idx) => (idx === i ? { ...x, a } : x)));
  const removePrompt = (i) => setPrompts((p) => p.filter((_, idx) => idx !== i));

  const draft = { photoURL: photos[0]?.url, photos: photos.map((p) => p.url), interests, prompts, location, bio, availability };
  const comp = completeness(draft);

  const save = async () => {
    setBusy(true); setError("");
    try {
      const uid = auth.currentUser.uid;
      const urls = [];
      for (const ph of photos) {
        if (ph.file) {
          const up = await compressImage(ph.file);
          const snap = await uploadBytes(ref(storage, `avatars/${uid}/${Date.now()}-${up.name}`), up);
          urls.push(await getDownloadURL(snap.ref));
        } else if (ph.url) { urls.push(ph.url); }
      }
      await saveProfile({
        displayName: titleCase(name), bio: bio.trim(), location: location.trim(),
        photos: urls, photoURL: urls[0] || null,
        interests, skillLevels,
        prompts: prompts.filter((p) => p.a && p.a.trim()).map((p) => ({ q: p.q, a: p.a.trim() })),
        style, pace, willTravel, availability, lookingFor, certifications, gearShare,
      });
      nav(-1);
    } catch (e) { setError(e.message || "Could not save."); setBusy(false); }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <StatusBar />
      <div className="flex items-center gap-3 px-5 py-3 border-b border-black/5">
        <button onClick={() => nav(-1)} aria-label="Back" className="text-brand-navy text-2xl leading-none">‹</button>
        <h1 className="text-lg font-semibold text-brand-navy">Edit Profile</h1>
      </div>

      <div className="flex-1 px-6 pt-3 overflow-y-auto no-scrollbar">
        {/* Completeness */}
        <div className="rounded-2xl bg-brand-tint p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-brand-navy">Profile {comp.score}% complete</span>
            {comp.score === 100 && <span className="text-brand-green text-sm font-semibold">All set ✓</span>}
          </div>
          <div className="h-2 rounded-full bg-white overflow-hidden">
            <div className="h-full bg-brand-green transition-all" style={{ width: `${comp.score}%` }} />
          </div>
          {comp.missing.length > 0 && <p className="text-ink/70 text-[12px] mt-2">Next: {comp.missing[0]}</p>}
        </div>

        {/* Photos */}
        <Label>Photos <span className="text-muted font-normal">· first is your main</span></Label>
        <div className="grid grid-cols-3 gap-2">
          {photos.map((ph, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-brand-tint">
              <img src={ph.url} alt="" className="w-full h-full object-cover" />
              {i === 0 && <span className="absolute top-1 left-1 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-brand-green text-white">Main</span>}
              <button onClick={() => removePhoto(i)} aria-label="Remove photo"
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/55 text-white grid place-items-center text-sm leading-none">×</button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <button onClick={() => fileRef.current?.click()} aria-label="Add photo"
              className="aspect-square rounded-xl bg-brand-tint border-2 border-dashed border-brand-green/50 grid place-items-center text-brand-green">
              <Plus className="w-7 h-7" />
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={addPhotos} className="hidden" />

        {/* Basics */}
        <Label>Display Name</Label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-[15px] outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/30 placeholder:text-muted" />
        <Label>Home base</Label>
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Denver, CO"
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-[15px] outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/30 placeholder:text-muted" />
        <Label>Bio</Label>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={300} placeholder="A line about your adventures"
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[15px] outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/30 placeholder:text-muted resize-none" />

        {/* Activities + skill */}
        <Label>Activities &amp; skill level</Label>
        <div className="space-y-2.5">
          {ACTIVITIES.map((a) => {
            const on = interests.includes(a.id);
            return (
              <div key={a.id} className={`rounded-xl border p-3 ${on ? "border-brand-green/40 bg-white" : "border-black/5 bg-brand-tint/40"}`}>
                <button onClick={() => toggleInterest(a.id)} className="w-full flex items-center justify-between">
                  <span className="font-semibold text-ink">{a.label}</span>
                  <span className={`w-6 h-6 rounded-full grid place-items-center ${on ? "bg-brand-green text-white" : "bg-white border border-black/10 text-transparent"}`}><Check className="w-4 h-4" /></span>
                </button>
                {on && (
                  <div className="flex rounded-lg border border-black/10 overflow-hidden mt-2.5">
                    {SKILLS.map((lvl) => (
                      <button key={lvl} onClick={() => setSkill(a.id, lvl)}
                        className={`flex-1 py-2 text-[12px] font-semibold ${(skillLevels[a.id] || "Beginner") === lvl ? "bg-brand-green text-white" : "bg-white text-ink"}`}>
                        {lvl}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Prompts */}
        <Label>Prompts <span className="text-muted font-normal">· up to {MAX_PROMPTS}</span></Label>
        <div className="space-y-3">
          {prompts.map((p, i) => (
            <div key={i} className="rounded-xl border border-black/10 p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[13px] font-bold text-brand-navy">{p.q}</span>
                <button onClick={() => removePrompt(i)} className="text-muted text-[13px]">Remove</button>
              </div>
              <textarea value={p.a} onChange={(e) => setAnswer(i, e.target.value)} rows={2} maxLength={PROMPT_MAXLEN}
                placeholder="Your answer…"
                className="w-full rounded-lg bg-brand-tint px-3 py-2 text-[15px] outline-none focus:ring-2 focus:ring-brand-green/30 placeholder:text-muted resize-none" />
            </div>
          ))}
          {prompts.length < MAX_PROMPTS && !picker && (
            <button onClick={() => setPicker(true)}
              className="w-full rounded-xl border-2 border-dashed border-brand-green/50 text-brand-green font-semibold py-3 flex items-center justify-center gap-2">
              <Plus className="w-5 h-5" /> Add a prompt
            </button>
          )}
          {picker && (
            <div className="rounded-xl border border-black/10 p-2 max-h-60 overflow-y-auto no-scrollbar">
              {PROMPTS.filter((q) => !usedQs.includes(q)).map((q) => (
                <button key={q} onClick={() => addPrompt(q)} className="w-full text-left px-3 py-2.5 rounded-lg text-[14px] text-ink hover:bg-brand-tint">{q}</button>
              ))}
              <button onClick={() => setPicker(false)} className="w-full text-center px-3 py-2 text-muted text-[13px]">Cancel</button>
            </div>
          )}
        </div>

        {/* Vitals */}
        <Label>Adventure style</Label>
        <Seg options={STYLE} value={style} onChange={setStyle} />
        <Label>Typical pace</Label>
        <Seg options={PACE} value={pace} onChange={setPace} />
        <Label>How far you'll travel</Label>
        <Seg options={TRAVEL} value={willTravel} onChange={setWillTravel} />
        <Label>Availability</Label>
        <Chips options={AVAILABILITY} values={availability} onToggle={tog(setAvailability)} />
        <Label>Looking for</Label>
        <Chips options={LOOKING_FOR} values={lookingFor} onToggle={tog(setLookingFor)} />
        <Label>Certifications <span className="text-muted font-normal">· builds trust</span></Label>
        <Chips options={CERTS} values={certifications} onToggle={tog(setCertifications)} />
        <Label>Gear I'll share</Label>
        <Chips options={GEAR} values={gearShare} onToggle={tog(setGearShare)} />

        {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
        <div className="h-4" />
      </div>

      <div className="px-6 pb-7 pt-3 border-t border-black/5">
        <button disabled={busy} onClick={save}
          className="w-full rounded-xl bg-brand-green hover:bg-brand-greenDark transition text-white font-semibold py-4 disabled:opacity-60">
          {busy ? "Saving…" : "Save profile"}
        </button>
      </div>
    </div>
  );
}
