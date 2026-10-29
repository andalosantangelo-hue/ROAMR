// Full-bleed mountain photo for the auth screens. The scrims keep the status bar and the
// button stack readable over any photo; `soft` blurs it for form-heavy screens.
export const HERO_SRC = "/img/splash-hero.jpg";

export default function MountainHero({ soft = false }) {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-[#0A1620]">
      <img src={HERO_SRC} alt="" fetchPriority="high" decoding="async"
        className={`absolute inset-0 w-full h-full object-cover object-[center_35%] ${soft ? "blur-md scale-110 opacity-70" : ""}`} />
      {/* top scrim for the status bar */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/45 to-transparent" />
      {/* bottom scrim: photo fades into ROAMR navy-black where the buttons sit */}
      <div className={`absolute inset-0 bg-gradient-to-t ${soft ? "from-[#0A1620] via-[#0A1620]/85 to-[#0A1620]/55" : "from-[#0A1620] via-[#0A1620]/70 via-35% to-transparent to-65%"}`} />
    </div>
  );
}
