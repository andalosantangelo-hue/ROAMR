import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, auth } from "../lib/firebase.js";
import { useAuth } from "../store/AuthContext.jsx";
import { compressImage } from "../lib/image.js";
import StatusBar from "../components/StatusBar.jsx";
import { Profile as UserIcon, Edit } from "../components/Icons.jsx";

export default function EditProfile() {
  const nav = useNavigate();
  const { user, profile, saveProfile } = useAuth();

  const [name, setName] = useState(profile?.displayName || user?.displayName || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [photo, setPhoto] = useState(profile?.photoURL || user?.photoURL || null);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const pick = (e) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setPhoto(URL.createObjectURL(f)); }
  };

  const save = async () => {
    setBusy(true); setError("");
    try {
      let photoURL = profile?.photoURL || user?.photoURL || null;
      if (file) {
        const uid = auth.currentUser.uid;
        const up = await compressImage(file);
        const snap = await uploadBytes(ref(storage, `avatars/${uid}/${Date.now()}-${up.name}`), up);
        photoURL = await getDownloadURL(snap.ref);
      }
      await saveProfile({ displayName: name.trim(), bio: bio.trim(), photoURL });
      nav(-1);
    } catch (e) {
      setError(e.message || "Could not save."); setBusy(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <StatusBar />
      <div className="flex items-center gap-3 px-5 py-3">
        <button onClick={() => nav(-1)} className="text-brand-navy text-2xl leading-none">‹</button>
        <h1 className="text-lg font-semibold text-brand-navy">Edit Profile</h1>
      </div>

      <div className="flex-1 px-6 pt-2 overflow-y-auto no-scrollbar">
        <div className="flex flex-col items-center">
          <button onClick={() => fileRef.current?.click()} className="relative">
            {photo ? (
              <img src={photo} alt="" className="w-28 h-28 rounded-full object-cover" />
            ) : (
              <span className="w-28 h-28 rounded-full bg-brand-navy text-brand-green grid place-items-center">
                <UserIcon className="w-14 h-14" />
              </span>
            )}
            <span className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-brand-green text-white grid place-items-center border-2 border-white">
              <Edit className="w-4 h-4" />
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={pick} className="hidden" />
        </div>

        <label className="block mt-7 text-sm font-semibold text-ink/80 mb-2">Display name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-4 text-[15px] outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/30 placeholder:text-muted" />

        <label className="block mt-5 text-sm font-semibold text-ink/80 mb-2">Bio</label>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="A line about your adventures"
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[15px] outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/30 placeholder:text-muted resize-none" />

        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
      </div>

      <div className="px-6 pb-7 pt-3">
        <button disabled={busy} onClick={save}
          className="w-full rounded-xl bg-brand-green hover:bg-brand-greenDark transition text-white font-semibold py-4 disabled:opacity-60">
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
