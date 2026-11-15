import { Navigate, useLocation } from "react-router-dom";
import { useAuth, needsOnboarding } from "../store/AuthContext.jsx";
import Logo from "./Logo.jsx";

export default function RequireAuth({ children }) {
  const { user, loading, profile, profileStatus } = useAuth();
  const loc = useLocation();
  const here = loc.pathname + loc.search;

  if (loading) {
    return (
      <div role="status" aria-busy="true" aria-label="Loading ROAMR" className="h-full grid place-items-center bg-brand-tint">
        <Logo size={56} showWord={false} className="motion-safe:animate-pulse" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace state={window.__roamrSigningOut ? null : { from: here }} />;
  // Someone who quit (or hit an error) mid-onboarding has no name/interests, and social
  // sign-ins skip the login form, so the 18+ check lives in onboarding too: send anyone
  // missing either back to finish instead of into the app.
  if (profileStatus === "ready" && (needsOnboarding(profile) || !profile?.ageConfirmed) && loc.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace state={{ from: here }} />;
  }
  return children;
}
