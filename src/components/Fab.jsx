import { Plus } from "./Icons.jsx";
export default function Fab({ onClick }) {
  return (
    <button onClick={onClick} aria-label="Create"
      className="w-14 h-14 rounded-2xl bg-brand-green text-white grid place-items-center shadow-lg active:scale-95 transition">
      <Plus className="w-7 h-7" />
    </button>
  );
}
