// Full-bleed night backdrop for the auth screens: navy sky, a scatter of stars, and
// layered ridgelines with a faint green rim (echoes the pine/peak in the ROAMR mark).

// Deterministic pseudo-random so the sky is identical on every render and in tests.
function rand(seed) {
  const x = Math.sin(seed * 127.1) * 43758.5453;
  return x - Math.floor(x);
}
const STARS = Array.from({ length: 70 }, (_, i) => ({
  x: rand(i + 1) * 100,
  y: rand(i + 101) * 62,
  r: rand(i + 201) < 0.85 ? 0.35 + rand(i + 301) * 0.35 : 0.9,
  o: 0.35 + rand(i + 401) * 0.6,
  twinkle: i % 9 === 0,
}));

export default function NightSky({ ridge = true }) {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-gradient-to-b from-[#0A1620] via-[#10232F] to-brand-navy">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r * 0.18} fill="white" opacity={s.o}
            className={s.twinkle ? "motion-safe:animate-pulse" : undefined} />
        ))}
      </svg>
      {ridge && (
        // Ridge rim sits around 40-50% up the screen so buttons below it rest on solid ground.
        <svg className="absolute inset-x-0 bottom-0 w-full h-[58%]" viewBox="0 0 400 200" preserveAspectRatio="none">
          <path d="M0 34 L40 14 L70 26 L115 4 L150 24 L190 10 L235 30 L270 14 L310 26 L350 8 L400 24 V200 H0Z"
            fill="#1C3A4D" opacity="0.55" />
          <path d="M0 50 L55 28 L95 42 L140 18 L185 40 L230 24 L270 44 L320 26 L365 40 L400 30 V200 H0Z"
            fill="#173142" opacity="0.85" />
          <path d="M0 66 L45 48 L90 60 L130 38 L170 56 L215 42 L260 62 L305 46 L350 58 L400 48 V200 H0Z"
            fill="#0E1F2A" />
          <path d="M0 66 L45 48 L90 60 L130 38 L170 56 L215 42 L260 62 L305 46 L350 58 L400 48"
            fill="none" stroke="#7DAD3F" strokeOpacity="0.4" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        </svg>
      )}
    </div>
  );
}
