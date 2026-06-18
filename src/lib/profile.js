// Shared profile model — the outdoor-tuned, Hinge-quality self-expression schema.
// Organized so depth is opt-in (progressive disclosure + completeness meter),
// never a giant required form. Used by Onboarding, Edit Profile, Public Profile.

export const MAX_PHOTOS = 6;
export const MAX_PROMPTS = 4;
export const PROMPT_MAXLEN = 160;

// ---- Prompts (outdoor library; stored as {q, a}) ----
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
  "The trip that changed me…",
  "My pre-dawn alpine-start ritual…",
  "Green flag in an adventure partner…",
  "I feel most alive when…",
];

// ---- Activities, skill, experience ----
export const ACTIVITIES = [
  { id: "outdoor", label: "Hiking & backpacking" },
  { id: "climb", label: "Climbing" },
  { id: "water", label: "Water" },
  { id: "wheel", label: "Biking" },
  { id: "snow", label: "Snow" },
  { id: "nature", label: "Nature & wildlife" },
  { id: "trail", label: "Trail / ultra running" },
  { id: "moto", label: "Moto / overland" },
];
export const SKILLS = ["Beginner", "Intermediate", "Advanced", "Expert"];
export const EXPERIENCE = ["<1 yr", "1–3 yrs", "3–5 yrs", "5–10 yrs", "10+ yrs"];

// ---- Outdoor style ----
export const TERRAIN = [
  "Alpine", "Desert", "Forest & trail", "Crag / rock", "Backcountry",
  "Snow & ice", "Ocean & coast", "Lakes & rivers", "Canyon",
];
export const INTENSITY = [
  { id: "chill", label: "Chill" }, { id: "moderate", label: "Moderate" },
  { id: "strenuous", label: "Strenuous" }, { id: "expedition", label: "Expedition" },
];
export const TRIP_DURATION = ["Half-day", "Day trips", "Overnighters", "Multi-day", "Week+ expeditions"];
export const PACE = [
  { id: "casual", label: "Casual" }, { id: "moderate", label: "Moderate" }, { id: "hard", label: "Hard-charging" },
];
export const RISK = [
  { id: "cautious", label: "Very cautious" }, { id: "measured", label: "Measured" },
  { id: "calculated", label: "Calculated risk" }, { id: "send", label: "Send it" },
];
export const TYPE2 = [
  { id: "comfort", label: "Comfort (Type 1)" }, { id: "some", label: "Some Type 2" }, { id: "love", label: "Type 2 is the point" },
];
export const PLANNING = [
  { id: "planner", label: "Type-A planner" }, { id: "flexible", label: "Flexible" }, { id: "spontaneous", label: "Spontaneous" },
];
export const FITNESS = [
  { id: "building", label: "Building a base" }, { id: "weekend", label: "Weekend-fit" },
  { id: "fit", label: "Very fit" }, { id: "training", label: "Training for an objective" },
];

// ---- Availability & travel ----
export const SEASONS = ["Spring", "Summer", "Fall", "Winter"];
export const AVAILABILITY = ["Weekday mornings", "Weekday evenings", "Weekends", "Flexible"];
export const LEAD_TIME = [
  { id: "spontaneous", label: "Same-day / spontaneous" }, { id: "few-days", label: "A few days' notice" }, { id: "weeks", label: "Weeks ahead" },
];
export const TRAVEL = [
  { id: "local", label: "Local only" }, { id: "day", label: "Day-trips" },
  { id: "roadtrip", label: "Road-trip ready" }, { id: "anywhere", label: "Will fly for it" },
];

// ---- Looking for / fit ----
export const LOOKING_FOR = [
  "Activity partners", "A regular crew", "Casual meetups", "Mentorship", "A mentee to bring along", "New to the area",
];
export const PARTNER_WANTS = [
  "Similar skill level", "Someone to push me", "Someone I can mentor", "Reliable & on time",
  "Safety-first mindset", "Good vibes / low ego", "Down for spontaneous trips",
];
export const DEALBREAKERS = [
  "No-shows / flakes", "Reckless with safety", "Doesn't Leave No Trace", "Chronic lateness", "Big egos", "Won't carry their weight",
];

// ---- Trust & gear ----
export const CERTS = [
  "Wilderness First Aid (WFA)", "Wilderness First Responder (WFR)", "CPR", "EMT",
  "Avalanche L1", "Avalanche L2", "Avalanche L3", "Lead belay certified",
  "Lifeguard", "Swiftwater rescue", "Search & Rescue", "Ski patrol",
];
export const GEAR = [
  "Tent", "Sleeping bag", "Kayak / SUP", "Climbing rack", "Ropes",
  "Skis / Splitboard", "Bike", "Cooler", "Camp stove", "GPS / InReach", "Roof rack / racks",
];

// ---- Personal ----
export const LANGUAGES = ["English", "Spanish", "French", "German", "Mandarin", "Portuguese", "Japanese", "Italian", "ASL"];
export const PETS = [
  { id: "dog", label: "I have a dog" }, { id: "dog-friendly", label: "Dog-friendly" }, { id: "no-pets", label: "No pets" },
];

export const labelOf = (list, id) => (list.find((o) => o.id === id) || {}).label || "";

// Weighted completeness — nudges high-value gaps first; depth is rewarded but not required.
export function completeness(p = {}) {
  const has = (v) => Array.isArray(v) ? v.length > 0 : !!(v && String(v).trim());
  const checks = [
    { ok: !!(p.photoURL || (p.photos && p.photos.length)), label: "Add a photo" },
    { ok: Array.isArray(p.interests) && p.interests.length >= 2, label: "Pick at least 2 activities" },
    { ok: Array.isArray(p.prompts) && p.prompts.some((x) => x && x.a && x.a.trim()), label: "Answer a prompt" },
    { ok: has(p.location), label: "Add your home base" },
    { ok: has(p.bio), label: "Write a short bio" },
    { ok: has(p.availability), label: "Set your availability" },
    { ok: has(p.terrain), label: "Add your favorite terrain" },
    { ok: !!(p.risk || p.intensity || p.pace), label: "Describe your style" },
    { ok: has(p.lookingFor) || has(p.partnerWants), label: "Say what you're looking for" },
  ];
  const done = checks.filter((c) => c.ok).length;
  return {
    score: Math.round((done / checks.length) * 100),
    done, total: checks.length,
    missing: checks.filter((c) => !c.ok).map((c) => c.label),
  };
}
