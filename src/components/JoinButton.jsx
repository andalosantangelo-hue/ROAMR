import { useState } from "react";

export default function JoinButton({ joined: joinedProp, onToggle, initial = false, className = "" }) {
  const [internal, setInternal] = useState(initial);
  const controlled = typeof onToggle === "function";
  const joined = controlled ? joinedProp : internal;
  const handle = () => (controlled ? onToggle() : setInternal((v) => !v));

  return (
    <button
      onClick={handle}
      className={`rounded-lg px-6 py-2 text-sm font-semibold transition ${
        joined
          ? "bg-white text-brand-green border border-brand-green"
          : "bg-brand-green text-white hover:bg-brand-greenDark"
      } ${className}`}
    >
      {joined ? "Joined" : "Join"}
    </button>
  );
}
