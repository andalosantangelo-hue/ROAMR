// Shared sign-in plumbing for the Welcome (Splash) and Login screens.
import { useNavigate, useLocation } from "react-router-dom";
import { track } from "./analytics.js";
import { safeReturnPath } from "./util.js";

// New users go to onboarding; returning users land where they were headed (a shared
// invite link) or Home. The deep link is carried through onboarding too.
export function useAuthRedirect() {
  const nav = useNavigate();
  const from = safeReturnPath(useLocation().state?.from);
  return ({ isNew }, method = "email") => {
    track(isNew ? "sign_up" : "login", { method });
    nav(isNew ? "/onboarding" : (from || "/app/home"), { replace: true, state: { from } });
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
    "auth/popup-blocked": "Your browser blocked the sign-in window. Allow pop-ups for ROAMR and try again.",
    "auth/cancelled-popup-request": "Sign-in cancelled.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/account-exists-with-different-credential": "You already have an account with this email. Sign in the way you did before.",
    "auth/user-disabled": "This account has been disabled. Contact admin@roamrapp.org.",
  };
  return m[code];
}
