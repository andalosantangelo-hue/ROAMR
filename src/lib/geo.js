// Location helpers: device position, place search, reverse geocoding, distance.
// Uses Photon (komoot's OSM geocoder) — free and keyless, fine for alpha.
// Before scale, swap PHOTON for a paid geocoder (Mapbox/MapTiler/Google) —
// see GO-LIVE notes. Every call is user-initiated, so volume stays low.

const PHOTON = "https://photon.komoot.io";

// "Telluride, Colorado" style label from a Photon feature's properties.
export function placeLabel(p = {}) {
  const head = p.name || [p.housenumber, p.street].filter(Boolean).join(" ") || p.city;
  const tail = [p.city !== head ? p.city : null, p.state || p.county, p.country !== "United States" ? p.country : null]
    .filter(Boolean);
  return [head, ...tail].filter(Boolean).join(", ");
}

const toPlace = (f) => ({
  label: placeLabel(f.properties),
  lat: f.geometry.coordinates[1],
  lng: f.geometry.coordinates[0],
  kind: f.properties.osm_value || f.properties.type || "place",
});

// Last device fix this session — used to bias suggestions toward where you are.
let lastFix = null;

export async function searchPlaces(q, near, { signal } = {}) {
  near = near || lastFix || recentPlaces()[0] || null;
  const term = (q || "").trim();
  if (term.length < 2) return [];
  const u = new URL(`${PHOTON}/api/`);
  u.searchParams.set("q", term);
  u.searchParams.set("limit", "6");
  u.searchParams.set("lang", "en");
  if (near?.lat != null) { u.searchParams.set("lat", near.lat); u.searchParams.set("lon", near.lng); u.searchParams.set("location_bias_scale", "0.4"); }
  const res = await fetch(u, { signal });
  if (!res.ok) return [];
  const json = await res.json();
  const seen = new Set();
  return (json.features || []).map(toPlace).filter((p) => p.label && !seen.has(p.label) && seen.add(p.label));
}

export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(`${PHOTON}/reverse?lat=${lat}&lon=${lng}&lang=en`);
    if (!res.ok) throw new Error("reverse failed");
    const f = (await res.json()).features?.[0];
    if (f) return { ...toPlace(f), lat, lng };
  } catch { /* fall through */ }
  return { label: "Current location", lat, lng, kind: "gps" };
}

export function currentPosition({ timeout = 10000 } = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error("Location isn't available on this device.")); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => { lastFix = { lat: p.coords.latitude, lng: p.coords.longitude }; resolve(lastFix); },
      (e) => reject(new Error(e.code === 1
        ? "Location permission is off. Turn it on in Settings to use your current location."
        : "Couldn't get your location — try again or type a place.")),
      { enableHighAccuracy: false, timeout, maximumAge: 5 * 60 * 1000 }
    );
  });
}

// Great-circle distance in miles.
export function milesBetween(a, b) {
  if (!a || !b || a.lat == null || b.lat == null) return Infinity;
  const R = 3958.8, rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Small recent-places list (per device convenience only).
const KEY = "roamr.recentPlaces";
export function recentPlaces() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]").slice(0, 4); } catch { return []; }
}
export function rememberPlace(p) {
  if (!p?.label || p.lat == null) return;
  try {
    const list = [p, ...recentPlaces().filter((x) => x.label !== p.label)].slice(0, 4);
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch { /* storage blocked */ }
}
