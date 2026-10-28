import { useRef, useState } from "react";

// Drag-to-look viewer for equirectangular 360° photos. Pure CSS background
// panning — no WebGL dependency — so it's light enough for the feed.
function Pano360({ src, alt }) {
  const [x, setX] = useState(50);
  const drag = useRef(null);
  const onDown = (e) => { drag.current = { start: e.clientX, x }; e.currentTarget.setPointerCapture?.(e.pointerId); };
  const onMove = (e) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.start;
    setX(((drag.current.x - dx / 6) % 100 + 100) % 100);
  };
  const onUp = () => { drag.current = null; };
  return (
    <div role="img" aria-label={alt || "360° photo"} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
      className="relative w-full h-full cursor-grab active:cursor-grabbing touch-pan-y select-none"
      style={{ backgroundImage: `url(${src})`, backgroundSize: "auto 100%", backgroundRepeat: "repeat-x", backgroundPosition: `${x}% 50%` }}>
      <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-1 rounded-md bg-black/55 text-white">360° · drag to look</span>
    </div>
  );
}

function AudioCard({ m }) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-brand-navy to-brand-navyDeep text-white p-4 flex flex-col justify-end gap-3">
      <div className="flex items-end gap-1 h-14 text-brand-greenBright" aria-hidden="true">
        {[6, 10, 14, 9, 12, 16, 8, 13, 10, 6, 11, 15, 9, 7, 12, 10].map((h, i) => (
          <span key={i} className="w-1.5 rounded-full bg-current opacity-80" style={{ height: `${h * 3}px` }} />
        ))}
      </div>
      <p className="text-[13px] font-semibold truncate">{m.name || "Audio"}</p>
      <audio src={m.url} controls preload="none" className="w-full h-9" />
    </div>
  );
}

// Swipeable media strip for a post. Falls back to the legacy single `photo`.
export default function PostMedia({ post }) {
  const media = Array.isArray(post.media) && post.media.length
    ? post.media
    : post.photo ? [{ type: "image", url: post.photo }] : [];
  const [idx, setIdx] = useState(0);
  if (!media.length) return null;

  const onScroll = (e) => {
    const el = e.currentTarget;
    setIdx(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
  };

  return (
    <div className="px-3">
      <div className="relative">
        <div onScroll={onScroll} className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar rounded-xl bg-brand-tint">
          {media.map((m, i) => (
            <div key={m.url + i} className="relative shrink-0 w-full h-64 snap-center overflow-hidden">
              {m.type === "image" && m.is360 && <Pano360 src={m.url} alt={post.title} />}
              {m.type === "image" && !m.is360 && <img src={m.url} alt={post.title || ""} loading="lazy" className="w-full h-full object-cover" />}
              {m.type === "video" && (
                <video src={m.url} poster={m.poster} controls playsInline preload="none" className="w-full h-full object-cover bg-black" />
              )}
              {m.type === "audio" && <AudioCard m={m} />}
            </div>
          ))}
        </div>
        {media.length > 1 && (
          <>
            <span className="absolute top-2 right-2 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-black/55 text-white">{idx + 1}/{media.length}</span>
            <div className="flex justify-center gap-1.5 mt-2" aria-hidden="true">
              {media.map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i === idx ? "w-4 bg-brand-green" : "w-1.5 bg-black/15"}`} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
