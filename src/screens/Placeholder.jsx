import StatusBar from "../components/StatusBar.jsx";
import Logo from "../components/Logo.jsx";

// Temporary placeholder for screens not yet built (screen-by-screen build).
export default function Placeholder({ title = "Screen", note = "Coming next" }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-8 bg-white">
      <Logo size={44} showWord={false} className="mb-5" />
      <h2 className="text-2xl font-extrabold text-brand-navy mb-1">{title}</h2>
      <p className="text-muted text-sm">{note}</p>
    </div>
  );
}
