import { Navigate, useLocation } from "react-router-dom";
import { useAuth, needsOnboarding } from "../store/AuthContext.jsx";
import Logo from "./Logo.jsx";

export default function RequireAuth({ children }) {
  const { user, loading, profile, profileStatus } = useAuth();
  const loc = useLocation();
  const here = loc.pathname + loc.search;

  if (loading) {
    return (
      <div className="h-full grid place-items-center bg-brand-tint">
        <Logo size={56} showWord={false} className="animate-pulse" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: here }} />;
  // Someone who quit (or hit an error) mid-onboarding has no name/interests; send them
  // back to finish instead of into an app that shows them as "Explorer".
  if (profileStatus === "ready" && needsOnboarding(profile) && loc.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace state={{ from: here }} />;
  }
  return children;
}
