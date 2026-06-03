// ROAMR logo: app-icon mark + optional wordmark
export default function Logo({ size = 36, showWord = true, word = "ROAMR", className = "", wordClass = "text-brand-navy" }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img src="/img/roamr-icon.png" alt="ROAMR"
        width={size} height={size}
        style={{ width: size, height: size }}
        className="rounded-[28%] shadow-sm select-none" draggable="false" />
      {showWord && (
        <span className={`font-extrabold tracking-tight ${wordClass}`} style={{ fontSize: size * 0.62 }}>
          {word}
        </span>
      )}
    </div>
  );
}
