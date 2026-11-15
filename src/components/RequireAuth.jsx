import { Navigate, useLocation } from "react-router-dom";
import { useAuth, needsOnboarding } from "../store/AuthContext.jsx";
import Logo from "./Logo.jsx";

export default function RequireAuth({ children }) {
  const { user, loading, profile, profileStatus } = useAuth();
  const loc = useLocation();
  const here = loc.pathname + loc.search;
  const onOnboarding = loc.pathname === "/onboarding";

  // Wait for the profile too: the 18+ gate below reads profile.ageConfirmed, so rendering
  // before it arrives would flash the app to someone who hasn't passed the age step.
  if (loading || (user && profileStatus === "loading")) {
    return (
      <div role="status" aria-busy="true" aria-label="Loading ROAMR" className="h-full grid place-items-center bg-brand-tint">
        <Logo size={56} showWord={false} className="motion-safe:animate-pulse" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace state={window.__roamrSigningOut ? null : { from: here }} />;
  if (profileStatus === "ready" && !onOnboarding) {
    // 18+ gate: Google/Apple sign-ins skip the login form, so every protected route checks it.
    // Someone who quit (or hit an error) mid-onboarding has no name/interests; send them
    // back to finish instead of into an app that shows them as "Explorer".
    if (!profile?.ageConfirmed || needsOnboarding(profile)) {
      return <Navigate to="/onboarding" replace state={{ from: here }} />;
    }
  }
  return children;
}
