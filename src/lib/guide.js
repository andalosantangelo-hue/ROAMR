import { doc, setDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase.js";

// Verified Guides: a guide applies here (private, owner-only doc), an admin reviews the
// credentials and sets status "approved" in the console, and the onGuideApplicationWrite
// Cloud Function puts a public `guide` badge on users/{uid}. Licence and insurance details
// never leave the private application doc.

export const GUIDE_SPECIALTIES = [
  "Fly fishing", "Fishing", "Hiking & backpacking", "Rock climbing", "Mountaineering",
  "Backcountry skiing", "Whitewater rafting", "Kayaking & canoeing", "Mountain biking",
  "Canyoneering", "Hunting", "Wildlife & birding", "Other",
];

// Mirrors the limits in firestore.rules (guideApplications). Keep the two in step.
export const GUIDE_LIMITS = {
  fullName: 80, specialties: 6, specialty: 40, region: 200, experienceYears: 80,
  certifications: 500, license: 300, insuranceProvider: 120, insurancePolicy: 80,
  website: 300, bio: 1000,
};

const s = (v) => (typeof v === "string" ? v.trim() : "");

// Returns { ok, errors, data }: `data` is exactly the doc shape the rules accept.
export function validateGuideApplication(form = {}) {
  const L = GUIDE_LIMITS;
  const errors = {};
  const fullName = s(form.fullName);
  const specialties = Array.isArray(form.specialties) ? form.specialties.map(s).filter(Boolean) : [];
  const region = s(form.region);
  const years = Number(form.experienceYears);
  const certifications = s(form.certifications);
  const license = s(form.license);
  const insuranceProvider = s(form.insuranceProvider);
  const insurancePolicy = s(form.insurancePolicy);
  const insuranceExpires = s(form.insuranceExpires);
  const website = s(form.website);
  const bio = s(form.bio);

  if (fullName.length < 2) errors.fullName = "Enter your full legal name.";
  else if (fullName.length > L.fullName) errors.fullName = `Keep it under ${L.fullName} characters.`;
  if (!specialties.length) errors.specialties = "Pick at least one thing you guide.";
  else if (specialties.length > L.specialties) errors.specialties = `Pick up to ${L.specialties}.`;
  else if (specialties.some((x) => x.length > L.specialty)) errors.specialties = "One of those is too long.";
  if (region.length < 2) errors.region = "Where do you guide? (e.g. Bozeman, MT)";
  else if (region.length > L.region) errors.region = `Keep it under ${L.region} characters.`;
  if (form.experienceYears === "" || form.experienceYears == null || !Number.isInteger(years) || years < 0 || years > L.experienceYears) {
    errors.experienceYears = "Enter whole years, 0–80.";
  }
  if (certifications.length > L.certifications) errors.certifications = `Keep it under ${L.certifications} characters.`;
  if (license.length < 2) errors.license = "Add your guide licence or permit (number and issuing state/agency).";
  else if (license.length > L.license) errors.license = `Keep it under ${L.license} characters.`;
  if (insuranceProvider.length < 2) errors.insuranceProvider = "Add your liability insurance provider.";
  else if (insuranceProvider.length > L.insuranceProvider) errors.insuranceProvider = `Keep it under ${L.insuranceProvider} characters.`;
  if (insurancePolicy.length < 2) errors.insurancePolicy = "Add your policy number.";
  else if (insurancePolicy.length > L.insurancePolicy) errors.insurancePolicy = `Keep it under ${L.insurancePolicy} characters.`;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(insuranceExpires)) errors.insuranceExpires = "Add the policy's expiry date.";
  else if (new Date(`${insuranceExpires}T23:59:59`) < new Date()) errors.insuranceExpires = "This policy has expired. Add a current one.";
  if (website && (!/^https?:\/\/\S+$/i.test(website) || website.length > L.website)) errors.website = "Use a full link starting with https://";
  if (bio.length > L.bio) errors.bio = `Keep it under ${L.bio} characters.`;

  const ok = Object.keys(errors).length === 0;
  return {
    ok, errors,
    data: ok ? {
      fullName, specialties, region, experienceYears: years, certifications, license,
      insuranceProvider, insurancePolicy, insuranceExpires, website, bio,
    } : null,
  };
}

// Submit or resubmit (after a rejection). Always "pending": only an admin can approve.
export async function submitGuideApplication(uid, data) {
  await setDoc(doc(db, "guideApplications", uid), {
    uid, ...data, status: "pending", createdAt: serverTimestamp(),
  });
}

// cb(null) when there's no application yet, else the doc's data (incl. status).
export function watchGuideApplication(uid, cb) {
  return onSnapshot(doc(db, "guideApplications", uid),
    (snap) => cb(snap.exists() ? snap.data() : null),
    () => cb(null));
}

// The public badge text, e.g. "Verified guide · Fly fishing, Kayaking & canoeing".
export function guideBadge(profile) {
  const g = profile?.guide;
  if (!g?.verified) return null;
  const list = Array.isArray(g.specialties) ? g.specialties.slice(0, 2) : [];
  return list.length ? `Verified guide · ${list.join(", ")}` : "Verified guide";
}
