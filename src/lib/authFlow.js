// Shared sign-in plumbing for the Welcome (Splash) and Login screens.
import { useNavigate } from "react-router-dom";
import { track } from "./analytics.js";

// New users go to onboarding; returning users always land on Home.
export function useAuthRedirect() {
  const nav = useNavigate();
  return ({ isNew }, method = "email") => {
    track(isNew ? "sign_up" : "login", { method });
    nav(isNew ? "/onboarding" : "/app/home", { replace: true });
  };
}

export function prettyError(code) {
  const m = {
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/wrong-password": "Incorrect password.",
    "auth/user-not-found": "No account with that email — try Create Account.",
    "auth/email-already-in-use": "That email already has an account — sign in instead.",
    "auth/weak-password": "Choose a stronger password (6+ characters).",
    "auth/popup-closed-by-user": "Sign-in cancelled.",
    "auth/operation-not-allowed": "This sign-in method isn't enabled yet in Firebase.",
    "auth/too-many-requests": "Too many attempts. Please wait and try again.",
    "auth/network-request-failed": "Network error — check your connection.",
  };
  return m[code];
}
