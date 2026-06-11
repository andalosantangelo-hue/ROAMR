import { useState, useEffect, useRef } from "react";
import { Search } from "./Icons.jsx";

export default function SearchBar({ placeholder = "Search", value, onChange, showFilter = true, delay = 250 }) {
  const [text, setText] = useState(value ?? "");
  const first = useRef(true);

  // Debounce: only notify the parent after the user pauses typing.
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => onChange?.(text), delay);
    return () => clearTimeout(t);
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 flex items-center gap-2 bg-white rounded-xl px-4 py-3 shadow-card">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-muted" />
        <Search className="w-5 h-5 text-ink/70" />
      </div>
    </div>
  );
}
