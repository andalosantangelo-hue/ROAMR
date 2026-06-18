import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, auth } from "../lib/firebase.js";
import { useAuth } from "../store/AuthContext.jsx";
import { compressImage } from "../lib/image.js";
import { titleCase } from "../lib/util.js";
import * as P from "../lib/profile.js";
import StatusBar from "../components/StatusBar.jsx";
import { Plus, Check, ChevronDown } from "../components/Icons.jsx";

/* ---- small building blocks ---- */
function Seg({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o.id} type="button" onClick={() => onChange(value === o.id ? "" : o.id)}
          className={`px-3.5 py-2 rounded-full text-[13px] font-semibold transition ${value === o.id ? "bg-brand-green text-white" : "bg-brand-tint text-brand-navy"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
function Chips({ options, values = [], onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const id = typeof o === "string" ? o : o.id;
        const label = typeof o === "string" ? o : o.label;
        return (
          <button key={id} type="button" onClick={() => onToggle(id)}
            className={`px-3.5 py-2 rounded-full text-sm font-semibold transition ${values.includes(id) ? "bg-brand-green text-white" : "bg-brand-tint text-brand-navy"}`}>
            {label}
          </button>
        );
      })}
    </div>
  );
}
const Sub = ({ children }) => <p className="text-[13px] font-semibold text-ink/70 mb-2 mt-4 first:mt-0">{children}</p>;
const inputCls = "w-full rounded-xl border border-black/10 bg-white px-4 py-3.5 text-[15px] outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/30 placeholder:text-muted";

function Section({ id, title, hint, filled, open, onToggle, children }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white shadow-card overflow-hidden">
      <button onClick={() => onToggle(id)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${filled ? "bg-brand-green" : "bg-black/15"}`} />
        <span className="flex-1">
          <span className="block font-bold text-brand-navy">{title}</span>
          {hint && <span className="block text-muted text-[12px]">{hint}</span>}
        </span>
        <ChevronDown className={`w-5 h-5 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-4 pb-4 pt-1">{children}</div>}
    </div>
  );
}

export default function EditProfile() {
  const nav = useNavigate();
  const { user, profile, saveProfile } = useAuth();
  const fileRef = useRef(null);

  const initPhotos = (profile?.photos?.length ? profile.photos : (profile?.photoURL ? [profile.photoURL] : [])).map((url) => ({ url }));
  const [photos, setPhotos] = useState(initPhotos);
  const [prompts, setPrompts] = useState(Array.isArray(profile?.prompts) ? profile.prompts : []);
  const [picker, setPicker] = useState(false);
  const [open, setOpen] = useState({ photos: true, about: true });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [f, setF] = useState(() => ({
    name: profile?.displayName || user?.displayName || "",
    location: profile?.location || "",
    bio: profile?.bio || "",
    languages: profile?.languages || [],
    pets: profile?.pets || "",
    interests: profile?.interests || [],
    skillLevels: { ...(profile?.skillLevels || {}) },
    experience: { ...(profile?.experience || {}) },
    terrain: profile?.terrain || [],
    intensity: profile?.intensity || "",
    pace: profile?.pace || "",
    risk: profile?.risk || "",
    type2: profile?.type2 || "",
    tripDuration: profile?.tripDuration || [],
    planning: profile?.planning || "",
    fitness: profile?.fitness || "",
    trainingFor: profile?.trainingFor || "",
    availability: profile?.availability || [],
    seasons: profile?.seasons || [],
    leadTime: profile?.leadTime || "",
    willTravel: profile?.willTravel || "",
    style: profile?.style || "",
    lookingFor: profile?.lookingFor || [],
    partnerWants: profile?.partnerWants || [],
    dealbreakers: profile?.dealbreakers || [],
    certifications: profile?.certifications || [],
    gearShare: profile?.gearShare || [],
    bucketList: (profile?.bucketList || []).join("\n"),
    recentTrips: profile?.recentTrips || "",
  }));
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const tog = (k) => (id) => setF((s) => { const a = s[k] || []; return { ...s, [k]: a.includes(id) ? a.filter((x) => x !== id) : [...a, id] }; });
  const toggleSection = (id) => setOpen((o) => ({ ...o, [id]: !o[id] }));

  const toggleInterest = (id) => setF((s) => ({ ...s, interests: s.interests.includes(id) ? s.interests.filter((x) => x !== id) : [...s.interests, id] }));
  const setSkill = (id, v) => setF((s) => ({ ...s, skillLevels: { ...s.skillLevels, [id]: v } }));
  const setExp = (id, v) => setF((s) => ({ ...s, experience: { ...s.experience, [id]: v } }));

  const addPhotos = (e) => {
    const files = Array.from(e.target.files || []);
    setPhotos((p) => [...p, ...files.map((file) => ({ file, url: URL.createObjectURL(file) }))].slice(0, P.MAX_PHOTOS));
  };
  const removePhoto = (i) => setPhotos((p) => p.filter((_, idx) => idx !== i));

  const usedQs = prompts.map((p) => p.q);
  const addPrompt = (q) => { setPrompts((p) => [...p, { q, a: "" }]); setPicker(false); };
  const setAnswer = (i, a) => setPrompts((p) => p.map((x, idx) => (idx === i ? { ...x, a } : x)));
  const removePrompt = (i) => setPrompts((p) => p.filter((_, idx) => idx !== i));

  const draft = { ...f, photoURL: photos[0]?.url, photos: photos.map((p) => p.url), prompts };
  const comp = P.completeness(draft);
  const picked = P.ACTIVITIES.filter((a) => f.interests.includes(a.id));

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
        displayName: titleCase(f.name), bio: f.bio.trim(), location: f.location.trim(),
        photos: urls, photoURL: urls[0] || null,
        languages: f.languages, pets: f.pets,
        interests: f.interests, skillLevels: f.skillLevels, experience: f.experience,
        terrain: f.terrain, intensity: f.intensity, pace: f.pace, risk: f.risk, type2: f.type2,
        tripDuration: f.tripDuration, planning: f.planning, fitness: f.fitness, trainingFor: f.trainingFor.trim(),
        availability: f.availability, seasons: f.seasons, leadTime: f.leadTime, willTravel: f.willTravel, style: f.style,
        lookingFor: f.lookingFor, partnerWants: f.partnerWants, dealbreakers: f.dealbreakers,
        certifications: f.certifications, gearShare: f.gearShare,
        bucketList: f.bucketList.split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 12),
        recentTrips: f.recentTrips.trim(),
        prompts: prompts.filter((p) => p.a && p.a.trim()).map((p) => ({ q: p.q, a: p.a.trim() })),
      });
      nav(-1);
    } catch (e) { setError(e.message || "Could not save."); setBusy(false); }
  };

  return (
    <div className="h-full flex flex-col bg-brand-tint/40">
      <StatusBar />
      <div className="flex items-center gap-3 px-5 py-3 border-b border-black/5 bg-white">
        <button onClick={() => nav(-1)} aria-label="Back" className="text-brand-navy text-2xl leading-none">‹</button>
        <h1 className="text-lg font-semibold text-brand-navy">Edit Profile</h1>
      </div>

      <div className="flex-1 px-4 pt-3 overflow-y-auto no-scrollbar space-y-3">
        {/* Completeness */}
        <div className="rounded-2xl bg-white shadow-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-brand-navy">Profile {comp.score}% complete</span>
            {comp.score === 100 && <span className="text-brand-green text-sm font-semibold">All set ✓</span>}
          </div>
          <div className="h-2 rounded-full bg-brand-tint overflow-hidden">
            <div className="h-full bg-brand-green transition-all" style={{ width: `${comp.score}%` }} />
          </div>
          {comp.missing.length > 0 && <p className="text-ink/70 text-[12px] mt-2">Next: {comp.missing[0]}</p>}
        </div>

        {/* 1. Photos */}
        <Section id="photos" title="Photos" hint="Up to 6 · first is your main" filled={photos.length > 0} open={open.photos} onToggle={toggleSection}>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((ph, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-brand-tint">
                <img src={ph.url} alt="" className="w-full h-full object-cover" />
                {i === 0 && <span className="absolute top-1 left-1 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-brand-green text-white">Main</span>}
                <button onClick={() => removePhoto(i)} aria-label="Remove photo" className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/55 text-white grid place-items-center text-sm leading-none">×</button>
              </div>
            ))}
            {photos.length < P.MAX_PHOTOS && (
              <button onClick={() => fileRef.current?.click()} aria-label="Add photo" className="aspect-square rounded-xl bg-brand-tint border-2 border-dashed border-brand-green/50 grid place-items-center text-brand-green">
                <Plus className="w-7 h-7" />
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={addPhotos} className="hidden" />
        </Section>

        {/* 2. About you */}
        <Section id="about" title="About you" hint="Name, home base, bio" filled={!!f.name && !!f.location} open={open.about} onToggle={toggleSection}>
          <Sub>Display name</Sub>
          <input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Your name" className={inputCls} />
          <Sub>Home base</Sub>
          <input value={f.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Denver, CO" className={inputCls} />
          <Sub>Bio</Sub>
          <textarea value={f.bio} onChange={(e) => set("bio", e.target.value)} rows={3} maxLength={300} placeholder="A line about your adventures" className={`${inputCls} resize-none`} />
          <Sub>Languages</Sub>
          <Chips options={P.LANGUAGES} values={f.languages} onToggle={tog("languages")} />
          <Sub>Pets</Sub>
          <Seg options={P.PETS} value={f.pets} onChange={(v) => set("pets", v)} />
        </Section>

        {/* 3. Activities & experience */}
        <Section id="acts" title="Activities & experience" hint="Skill + years for each" filled={f.interests.length > 0} open={open.acts} onToggle={toggleSection}>
          <div className="flex flex-wrap gap-2">
            {P.ACTIVITIES.map((a) => (
              <button key={a.id} type="button" onClick={() => toggleInterest(a.id)}
                className={`px-3.5 py-2 rounded-full text-sm font-semibold transition ${f.interests.includes(a.id) ? "bg-brand-green text-white" : "bg-brand-tint text-brand-navy"}`}>
                {a.label}
              </button>
            ))}
          </div>
          {picked.map((a) => (
            <div key={a.id} className="rounded-xl border border-black/10 p-3 mt-3">
              <p className="font-semibold text-ink mb-2">{a.label}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-navy/50 mb-1.5">Skill</p>
              <div className="flex rounded-lg border border-black/10 overflow-hidden mb-2.5">
                {P.SKILLS.map((lvl) => (
                  <button key={lvl} onClick={() => setSkill(a.id, lvl)} className={`flex-1 py-2 text-[12px] font-semibold ${(f.skillLevels[a.id] || "Beginner") === lvl ? "bg-brand-green text-white" : "bg-white text-ink"}`}>{lvl}</button>
                ))}
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-navy/50 mb-1.5">Experience</p>
              <div className="flex flex-wrap gap-1.5">
                {P.EXPERIENCE.map((y) => (
                  <button key={y} onClick={() => setExp(a.id, y)} className={`px-2.5 py-1.5 rounded-full text-[12px] font-semibold ${f.experience[a.id] === y ? "bg-brand-navy text-white" : "bg-brand-tint text-brand-navy"}`}>{y}</button>
                ))}
              </div>
            </div>
          ))}
        </Section>

        {/* 4. Outdoor style */}
        <Section id="style" title="Your outdoor style" hint="Terrain, intensity, risk, vibe" filled={f.terrain.length > 0 || !!f.risk} open={open.style} onToggle={toggleSection}>
          <Sub>Favorite terrain</Sub>
          <Chips options={P.TERRAIN} values={f.terrain} onToggle={tog("terrain")} />
          <Sub>Typical intensity</Sub>
          <Seg options={P.INTENSITY} value={f.intensity} onChange={(v) => set("intensity", v)} />
          <Sub>Pace</Sub>
          <Seg options={P.PACE} value={f.pace} onChange={(v) => set("pace", v)} />
          <Sub>Risk tolerance</Sub>
          <Seg options={P.RISK} value={f.risk} onChange={(v) => set("risk", v)} />
          <Sub>Type 2 fun</Sub>
          <Seg options={P.TYPE2} value={f.type2} onChange={(v) => set("type2", v)} />
          <Sub>Trip length I'm into</Sub>
          <Chips options={P.TRIP_DURATION} values={f.tripDuration} onToggle={tog("tripDuration")} />
          <Sub>Planning style</Sub>
          <Seg options={P.PLANNING} value={f.planning} onChange={(v) => set("planning", v)} />
          <Sub>Fitness</Sub>
          <Seg options={P.FITNESS} value={f.fitness} onChange={(v) => set("fitness", v)} />
          <Sub>Training for (optional)</Sub>
          <input value={f.trainingFor} onChange={(e) => set("trainingFor", e.target.value)} maxLength={80} placeholder="e.g. Rainier in July" className={inputCls} />
        </Section>

        {/* 5. Availability & travel */}
        <Section id="logistics" title="Availability & travel" hint="When & how far you roam" filled={f.availability.length > 0 || !!f.willTravel} open={open.logistics} onToggle={toggleSection}>
          <Sub>Usually free</Sub>
          <Chips options={P.AVAILABILITY} values={f.availability} onToggle={tog("availability")} />
          <Sub>Active seasons</Sub>
          <Chips options={P.SEASONS} values={f.seasons} onToggle={tog("seasons")} />
          <Sub>How much lead time you need</Sub>
          <Seg options={P.LEAD_TIME} value={f.leadTime} onChange={(v) => set("leadTime", v)} />
          <Sub>How far you'll travel</Sub>
          <Seg options={P.TRAVEL} value={f.willTravel} onChange={(v) => set("willTravel", v)} />
        </Section>

        {/* 6. Looking for */}
        <Section id="fit" title="Looking for" hint="Partners, the vibe, dealbreakers" filled={f.lookingFor.length > 0 || f.partnerWants.length > 0} open={open.fit} onToggle={toggleSection}>
          <Sub>I'm here for</Sub>
          <Chips options={P.LOOKING_FOR} values={f.lookingFor} onToggle={tog("lookingFor")} />
          <Sub>In a partner I value</Sub>
          <Chips options={P.PARTNER_WANTS} values={f.partnerWants} onToggle={tog("partnerWants")} />
          <Sub>Not my vibe</Sub>
          <Chips options={P.DEALBREAKERS} values={f.dealbreakers} onToggle={tog("dealbreakers")} />
        </Section>

        {/* 7. Trust & gear */}
        <Section id="trust" title="Trust & gear" hint="Certs and gear you'll share" filled={f.certifications.length > 0 || f.gearShare.length > 0} open={open.trust} onToggle={toggleSection}>
          <Sub>Certifications & wilderness/medical training</Sub>
          <Chips options={P.CERTS} values={f.certifications} onToggle={tog("certifications")} />
          <Sub>Gear I'll share</Sub>
          <Chips options={P.GEAR} values={f.gearShare} onToggle={tog("gearShare")} />
        </Section>

        {/* 8. Prompts */}
        <Section id="prompts" title="Prompts" hint={`Up to ${P.MAX_PROMPTS} · the personality layer`} filled={prompts.some((p) => p.a && p.a.trim())} open={open.prompts} onToggle={toggleSection}>
          <div className="space-y-3">
            {prompts.map((p, i) => (
              <div key={i} className="rounded-xl border border-black/10 p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[13px] font-bold text-brand-navy">{p.q}</span>
                  <button onClick={() => removePrompt(i)} className="text-muted text-[13px]">Remove</button>
                </div>
                <textarea value={p.a} onChange={(e) => setAnswer(i, e.target.value)} rows={2} maxLength={P.PROMPT_MAXLEN} placeholder="Your answer…" className="w-full rounded-lg bg-brand-tint px-3 py-2 text-[15px] outline-none focus:ring-2 focus:ring-brand-green/30 placeholder:text-muted resize-none" />
              </div>
            ))}
            {prompts.length < P.MAX_PROMPTS && !picker && (
              <button onClick={() => setPicker(true)} className="w-full rounded-xl border-2 border-dashed border-brand-green/50 text-brand-green font-semibold py-3 flex items-center justify-center gap-2">
                <Plus className="w-5 h-5" /> Add a prompt
              </button>
            )}
            {picker && (
              <div className="rounded-xl border border-black/10 p-2 max-h-60 overflow-y-auto no-scrollbar">
                {P.PROMPTS.filter((q) => !usedQs.includes(q)).map((q) => (
                  <button key={q} onClick={() => addPrompt(q)} className="w-full text-left px-3 py-2.5 rounded-lg text-[14px] text-ink hover:bg-brand-tint">{q}</button>
                ))}
                <button onClick={() => setPicker(false)} className="w-full text-center px-3 py-2 text-muted text-[13px]">Cancel</button>
              </div>
            )}
          </div>
        </Section>

        {/* 9. Bucket list & recent trips */}
        <Section id="trips" title="Bucket list & recent trips" hint="Where you've been & where you're headed" filled={!!f.bucketList.trim() || !!f.recentTrips.trim()} open={open.trips} onToggle={toggleSection}>
          <Sub>Bucket-list adventures <span className="text-muted font-normal">· one per line</span></Sub>
          <textarea value={f.bucketList} onChange={(e) => set("bucketList", e.target.value)} rows={4} placeholder={"Thru-hike the JMT\nClimb the Grand Teton\nSki-tour in Japan"} className={`${inputCls} resize-none`} />
          <Sub>Recent trips</Sub>
          <textarea value={f.recentTrips} onChange={(e) => set("recentTrips", e.target.value)} rows={3} maxLength={300} placeholder="Where have you been lately?" className={`${inputCls} resize-none`} />
        </Section>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="h-2" />
      </div>

      <div className="px-6 pb-7 pt-3 border-t border-black/5 bg-white">
        <button disabled={busy} onClick={save} className="w-full rounded-xl bg-brand-green hover:bg-brand-greenDark transition text-white font-semibold py-4 disabled:opacity-60">
          {busy ? "Saving…" : "Save profile"}
        </button>
      </div>
    </div>
  );
}
