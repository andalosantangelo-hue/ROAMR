// Shared profile model: the "self-expression" options used by Onboarding,
// Edit Profile, and Public Profile. Outdoor-tuned adaptation of Hinge's
// photos + prompts + vitals structure.

export const MAX_PHOTOS = 6;
export const MAX_PROMPTS = 3;
export const PROMPT_MAXLEN = 160;

// Outdoor prompt library (grouped only for the picker; stored as {q, a}).
export const PROMPTS = [
  "My next adventure is…",
  "Bucket-list trip…",
  "Best Type 2 fun I've had…",
  "How I got into the outdoors…",
  "My outdoor hot take…",
  "Sunrise or sunset summit…",
  "I'll always say yes to…",
  "Looking for partners who…",
  "My go-to local spot…",
  "Trail snack I swear by…",
  "Most-used piece of gear…",
  "Worst trail decision I've made…",
  "My ideal weekend…",
  "A skill I want to learn…",
];

export const STYLE = [
  { id: "chill", label: "Chill & scenic" },
  { id: "balanced", label: "Balanced" },
  { id: "send", label: "Send it / Type 2" },
];
export const PACE = [
  { id: "casual", label: "Casual" },
  { id: "moderate", label: "Moderate" },
  { id: "hard", label: "Hard-charging" },
];
export const AVAILABILITY = ["Weekends", "Weekday mornings", "Weekday evenings", "Flexible"];
export const TRAVEL = [
  { id: "local", label: "Local only" },
  { id: "day", label: "Day-trips" },
  { id: "roadtrip", label: "Road-trip ready" },
];
export const CERTS = [
  "Wilderness First Aid", "Wilderness First Responder", "CPR",
  "Avalanche L1", "Avalanche L2", "Lead belay certified", "Lifeguard", "Swiftwater rescue",
];
export const GEAR = [
  "Tent", "Sleeping bag", "Kayak / SUP", "Climbing rack", "Ropes",
  "Skis / Splitboard", "Bike", "Cooler", "Camp stove",
];
export const LOOKING_FOR = [
  "Activity partners", "A regular crew", "Casual meetups", "Mentorship", "New to the area",
];

export const labelOf = (list, id) => (list.find((o) => o.id === id) || {}).label || "";

// Weighted completeness — nudges the highest-value gaps, not every field.
export function completeness(p = {}) {
  const checks = [
    { key: "photo", ok: !!(p.photoURL || (p.photos && p.photos.length)), label: "Add a photo" },
    { key: "activities", ok: Array.isArray(p.interests) && p.interests.length >= 2, label: "Pick at least 2 activities" },
    { key: "prompt", ok: Array.isArray(p.prompts) && p.prompts.some((x) => x && x.a && x.a.trim()), label: "Answer a prompt" },
    { key: "location", ok: !!(p.location && p.location.trim()), label: "Add your home base" },
    { key: "bio", ok: !!(p.bio && p.bio.trim()), label: "Write a short bio" },
    { key: "availability", ok: Array.isArray(p.availability) && p.availability.length > 0, label: "Set your availability" },
  ];
  const done = checks.filter((c) => c.ok).length;
  return {
    score: Math.round((done / checks.length) * 100),
    done,
    total: checks.length,
    missing: checks.filter((c) => !c.ok).map((c) => c.label),
  };
}

export const ACTIVITIES = [
  { id: "outdoor", label: "Outdoor" },
  { id: "water", label: "Water" },
  { id: "wheel", label: "Wheels" },
  { id: "nature", label: "Nature" },
  { id: "snow", label: "Snow" },
];
export const SKILLS = ["Beginner", "Intermediate", "Advanced"];
