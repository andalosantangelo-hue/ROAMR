// Trust & Safety shared model — constants + helpers used across the safety screens.

export const WAIVER_VERSION = 1;

export const SAFETY_NORMS = [
  "Meet in a public place the first time, and tell someone your plan.",
  "Share a trip plan with an emergency contact before you head out.",
  "Check the weather, conditions, and your route — and know your limits.",
  "Be honest about your skill and experience. It keeps everyone safe.",
  "Trust your gut. If something feels off, leave. You owe no one an explanation.",
  "ROAMR connects people but isn't there on the trail — you adventure at your own risk.",
];

// Post-trip review dimensions (1–5 each). overall = avg of these.
export const REVIEW_DIMS = [
  { key: "reliability", label: "Showed up / reliable" },
  { key: "skillHonesty", label: "Honest about skill" },
  { key: "safety", label: "Safety-minded" },
  { key: "vibe", label: "Good vibe" },
];

export const WHO_CAN_MESSAGE = [
  { id: "everyone", label: "Everyone" },
  { id: "verified", label: "Verified members" },
  { id: "following", label: "People I follow" },
];

export const VERIFY_TIERS = { photo: "Photo verified", phone: "Phone verified", id: "ID verified" };

export const GENDERS = [
  { id: "woman", label: "Woman" }, { id: "man", label: "Man" },
  { id: "nonbinary", label: "Non-binary" }, { id: "na", label: "Prefer not to say" },
];

export const BLOOD_TYPES = ["A+", "A−", "B+", "B−", "AB+", "AB−", "O+", "O−", "Unknown"];

export const TRIP_STATUS = {
  planned: { label: "Planned", cls: "bg-brand-tint text-brand-navy" },
  active: { label: "On the trail", cls: "bg-brand-green text-white" },
  safe: { label: "Back safe", cls: "bg-brand-tint text-brand-green" },
  overdue: { label: "Overdue", cls: "bg-red-100 text-red-700" },
  cancelled: { label: "Cancelled", cls: "bg-black/5 text-muted" },
};

export const GRACE_OPTIONS = [
  { id: 30, label: "30 min" }, { id: 60, label: "1 hour" }, { id: 120, label: "2 hours" }, { id: 180, label: "3 hours" },
];

// Safety-specific report categories (extends the existing report flow).
export const SAFETY_REPORT_REASONS = [
  { id: "unsafe", label: "Unsafe or reckless behavior" },
  { id: "harassment", label: "Harassment or threats" },
  { id: "fake", label: "Fake or impersonated profile" },
  { id: "meetup", label: "Safety concern at a meetup" },
  { id: "inappropriate", label: "Inappropriate messages or content" },
  { id: "other", label: "Something else" },
];
export const SAFETY_RESPONSE_COMMITMENT = "Safety reports are reviewed by our team within 24 hours. If you're in immediate danger, call your local emergency number.";

// Trust score display — graceful with low volume.
export function trustLabel(ratingAvg, ratingCount) {
  if (!ratingCount || ratingCount < 3) return { stars: ratingAvg || 0, text: "New partner", isNew: true };
  return { stars: Math.round((ratingAvg || 0) * 10) / 10, text: `${(Math.round((ratingAvg || 0) * 10) / 10).toFixed(1)} · ${ratingCount} reviews`, isNew: false };
}

export const overallOf = (ratings = {}) => {
  const vals = REVIEW_DIMS.map((d) => Number(ratings[d.key]) || 0).filter((n) => n > 0);
  return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0;
};
