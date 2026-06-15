import { NavLink } from "react-router-dom";
import { Home, Activities, Tribes, Market, Profile } from "./Icons.jsx";

const tabs = [
  { to: "/app/home", label: "Home", Icon: Home },
  { to: "/app/activities", label: "Activities", Icon: Activities },
  { to: "/app/tribes", label: "Tribes", Icon: Tribes },
  { to: "/app/marketplace", label: "Marketplace", Icon: Market },
  { to: "/app/profile", label: "Profile", Icon: Profile },
];

export default function BottomNav() {
  return (
    <nav className="bg-brand-navy text-white/70 shadow-nav">
      <ul className="flex items-stretch justify-between px-2 pt-2 pb-5">
        {tabs.map(({ to, label, Icon }) => (
          <li key={to} className="flex-1">
            <NavLink to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-1 text-[11px] font-semibold transition-colors ${
                  isActive ? "text-brand-greenBright" : "text-brand-greenBright/75"
                }`
              }>
              <Icon className="w-[22px] h-[22px]" />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
