import { useNavigate } from "react-router-dom";
import StatusBar from "../components/StatusBar.jsx";

export default function Splash() {
  const nav = useNavigate();
  return (
    <div className="relative h-full w-full text-white">
      <img
        src="https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=900&q=80"
        alt="Mountain landscape"
        className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/15" />
      <div className="relative h-full flex flex-col">
        <StatusBar dark />
        <div className="mt-auto px-6 pb-8">
          <p className="text-white/85 text-sm mb-1">Discover your next adventure</p>
          <h1 className="text-[38px] leading-[1.05] font-extrabold mb-6">
            Find your tribe<br />Get outside!
          </h1>
          <button
            onClick={() => nav("/login")}
            className="w-full bg-brand-green hover:bg-brand-greenDark transition text-white font-semibold text-lg rounded-2xl py-4 shadow-lg">
            Get Started
          </button>
          <div className="mx-auto mt-5 h-1.5 w-32 rounded-full bg-white/70" />
        </div>
      </div>
    </div>
  );
}

