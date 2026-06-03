import { Search, Filter } from "./Icons.jsx";

export default function SearchBar({ placeholder = "Search", value, onChange, showFilter = true }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 flex items-center gap-2 bg-white rounded-xl px-4 py-3 shadow-card">
        <input
          value={value ?? ""}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-muted" />
        <Search className="w-5 h-5 text-ink/70" />
      </div>
      {showFilter && (
        <button className="w-12 h-12 grid place-items-center bg-white rounded-xl shadow-card text-ink/80">
          <Filter className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
