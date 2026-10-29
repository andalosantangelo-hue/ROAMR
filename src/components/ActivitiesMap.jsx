import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "leaflet/dist/leaflet.css";

// Default view when we know nothing: the San Juans (home turf).
const DEFAULT = { lat: 37.9375, lng: -107.8123, zoom: 9 };

const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const fmtWhen = (w) => {
  if (!w) return "";
  const d = new Date(w);
  return isNaN(d) ? "" : d.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
};

// Interactive map of every geotagged activity. Leaflet is loaded lazily so the
// list view never pays for it. Tiles: OpenStreetMap (swap for MapTiler/Stadia
// with an API key before launch — OSM's volunteer tile servers aren't for apps at scale).
export default function ActivitiesMap({ items, center, radiusMiles, onSearchArea }) {
  const el = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);
  const ring = useRef(null);
  const L = useRef(null);
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  const [moved, setMoved] = useState(false);

  useEffect(() => {
    let alive = true;
    import("leaflet").then((mod) => {
      if (!alive || !el.current || map.current) return;
      L.current = mod.default || mod;
      const start = center?.lat != null ? center : DEFAULT;
      map.current = L.current.map(el.current, { zoomControl: false, attributionControl: true, zoomSnap: 0.25, keyboard: false })
        .setView([start.lat, start.lng], center ? 10 : DEFAULT.zoom);
      L.current.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18, attribution: "© OpenStreetMap",
      }).addTo(map.current);
      L.current.control.zoom({ position: "bottomright" }).addTo(map.current);
      layer.current = L.current.layerGroup().addTo(map.current);
      map.current.on("dragend", () => setMoved(true));
      map.current.on("popupopen", (e) => {
        const btn = e.popup.getElement()?.querySelector("[data-open]");
        if (btn) btn.onclick = () => nav(`/comments/activities/${btn.dataset.open}`);
      });
      // The container is sized after the lazy chunk mounts; re-measure before fitting.
      requestAnimationFrame(() => { map.current?.invalidateSize(); setReady(true); });
    });
    return () => { alive = false; map.current?.remove(); map.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Markers.
  useEffect(() => {
    if (!ready) return;
    const Lf = L.current;
    layer.current.clearLayers();
    const pts = [];
    items.forEach((a) => {
      if (a.geo?.lat == null) return;
      pts.push([a.geo.lat, a.geo.lng]);
      const icon = Lf.divIcon({
        className: "",
        html: `<div class="roamr-pin"><span>${esc((a.authorName || "R")[0].toUpperCase())}</span></div>`,
        iconSize: [36, 44], iconAnchor: [18, 42], popupAnchor: [0, -38],
      });
      Lf.marker([a.geo.lat, a.geo.lng], { icon })
        .bindPopup(
          `<div class="roamr-pop">
             <p class="t">${esc(a.text).slice(0, 120)}</p>
             <p class="m">${esc(a.location || "")}${a.when ? " · " + esc(fmtWhen(a.when)) : ""}</p>
             <p class="m">${esc(a.skillLevel || "All Levels")} · ${a.attendeeCount || 0} going</p>
             <button data-open="${esc(a.id)}">View activity</button>
           </div>`, { closeButton: false, maxWidth: 240 })
        .addTo(layer.current);
    });
    if (!center && pts.length) map.current.fitBounds(pts, { padding: [40, 40], maxZoom: 12 });
  }, [ready, items]); // eslint-disable-line react-hooks/exhaustive-deps

  // Search center + radius ring.
  useEffect(() => {
    if (!ready) return;
    ring.current?.remove();
    ring.current = null;
    if (center?.lat == null) return;
    map.current.invalidateSize();
    if (radiusMiles) {
      ring.current = L.current.circle([center.lat, center.lng], {
        radius: radiusMiles * 1609.34, color: "#5A7E2D", weight: 1.5, fillColor: "#7DAD3F", fillOpacity: 0.08,
      }).addTo(map.current);
      map.current.fitBounds(ring.current.getBounds(), { padding: [16, 16] });
    } else {
      map.current.setView([center.lat, center.lng], 10);
    }
    setMoved(false);
  }, [ready, center?.lat, center?.lng, radiusMiles]);  

  const unmapped = items.filter((a) => a.geo?.lat == null).length;

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-card bg-brand-tint" style={{ height: "calc(100dvh - 300px)", minHeight: 360 }}>
      <div ref={el} className="absolute inset-0 z-0" aria-label="Map of activities" />
      {moved && onSearchArea && (
        <button onClick={() => { const c = map.current.getCenter(); onSearchArea({ lat: c.lat, lng: c.lng }); setMoved(false); }}
          className="absolute top-3 left-1/2 -translate-x-1/2 z-[500] bg-white rounded-full shadow-card px-4 py-2 text-[13px] font-semibold text-brand-navy min-h-[40px]">
          Search this area
        </button>
      )}
      {unmapped > 0 && (
        <span className="absolute bottom-3 left-3 z-[500] bg-white/95 rounded-full px-3 py-1.5 text-[11px] text-muted shadow-card">
          {unmapped} without a pin · see List
        </span>
      )}
    </div>
  );
}
