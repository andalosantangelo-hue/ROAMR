import { useNavigate } from "react-router-dom";
import { Edit, Gear, Card, Help, Info, ChevronRight, Profile as UserIcon } from "../components/Icons.jsx";
import { useAuth } from "../store/AuthContext.jsx";

const ITEMS = [
  { icon: Edit, title: "Edit Profile", sub: "Update personal info, and picture", to: "/edit-profile" },
  { icon: Gear, title: "Account Settings", sub: "Manage account preferences", to: "/settings" },
  { icon: Card, title: "Membership", sub: "Change your plan and payment method", to: "/app/premium" },
  { icon: Help, title: "Help Centre", sub: "Share your feedback or questions with us" },
  { icon: Info, title: "About", sub: "Terms of Service and Privacy Policy" },
];

export default function Profile() {
  const nav = useNavigate();
  const { user, profile, logout } = useAuth();

  const name = profile?.displayName || user?.displayName || (user?.email ? user.email.split("@")[0] : "Explorer");
  const email = user?.email || user?.phoneNumber || "";
  const photo = profile?.photoURL || user?.photoURL;

  const onSignOut = async () => { await logout(); nav("/login", { replace: true }); };

  return (
    <div className="px-6 pt-8 pb-6 bg-white min-h-full">
      <div className="flex flex-col items-center mb-8">
        {photo ? (
          <img src={photo} alt="" className="w-28 h-28 rounded-full object-cover" />
        ) : (
          <span className="w-28 h-28 rounded-full bg-brand-navy text-brand-green grid place-items-center">
            <UserIcon className="w-14 h-14" />
          </span>
        )}
        <h2 className="text-2xl font-extrabold text-brand-navy mt-4">{name}</h2>
        {email && <p className="text-muted text-[15px]">{email}</p>}
      </div>

      <div className="divide-y divide-black/5">
        {ITEMS.map(({ icon: Icon, title, sub, to }) => (
          <button key={title} onClick={() => to && nav(to)}
            className="w-full flex items-center gap-4 py-4 text-left">
            <Icon className="w-6 h-6 text-brand-navy shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-ink">{title}</div>
              <div className="text-muted text-[13px]">{sub}</div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted" />
          </button>
        ))}
      </div>

      <button onClick={onSignOut}
        className="w-full mt-8 rounded-xl border border-red-200 text-red-600 font-semibold py-3.5 active:scale-[0.99] transition">
        Sign out
      </button>
    </div>
  );
}
