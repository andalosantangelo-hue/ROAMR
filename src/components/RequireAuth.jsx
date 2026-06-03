import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../store/AuthContext.jsx";
import Logo from "./Logo.jsx";

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading) {
    return (
      <div className="h-full grid place-items-center bg-brand-tint">
        <Logo size={56} showWord={false} className="animate-pulse" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return children;
}
