// Full-bleed mountain photo for the auth screens. Slow push-in + drifting mist make it feel
// alive (motion-safe only); scrims keep the status bar and button stack readable over any photo.
// `soft` blurs and darkens it for form-heavy screens. Swap the photo by changing HERO_SRC.
export const HERO_SRC = "/img/splash-hero.jpg";

const MIST = "absolute rounded-[50%] bg-white blur-3xl pointer-events-none";

export default function MountainHero({ soft = false }) {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-[#0A1620]">
      <img src={HERO_SRC} alt="" fetchPriority="high" decoding="async"
        className={`absolute inset-0 w-full h-full object-cover object-[center_35%] motion-safe:animate-hero-zoom
          ${soft ? "blur-md scale-110 opacity-70" : ""}`} />

      {/* mist banks drifting across the ridgeline and valley */}
      <div className={`${MIST} left-[-30%] top-[34%] w-[160%] h-[16%] opacity-[0.22] motion-safe:animate-mist-slow`} />
      <div className={`${MIST} left-[-20%] top-[46%] w-[140%] h-[12%] opacity-[0.18] motion-safe:animate-mist-fast`} />
      <div className={`${MIST} left-[-40%] top-[56%] w-[180%] h-[10%] opacity-[0.12] motion-safe:animate-mist-slow`} />

      {/* top scrim for the status bar */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/45 to-transparent" />
      {/* bottom scrim: photo fades into ROAMR navy where the buttons sit */}
      <div className={`absolute inset-0 bg-gradient-to-t ${soft ? "from-[#0A1620] via-[#0A1620]/85 to-[#0A1620]/55" : "from-[#0A1620] via-[#0A1620]/70 via-35% to-transparent to-65%"}`} />
    </div>
  );
}
