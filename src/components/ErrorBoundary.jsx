import React from "react";
import Logo from "./Logo.jsx";
import * as Sentry from "@sentry/react";

export default class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) {
    console.error("ROAMR crash:", error, info);
    Sentry.captureException(error); // no-op unless VITE_SENTRY_DSN is set
  }
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center text-center px-8 bg-brand-tint">
        <Logo size={56} showWord={false} className="mb-5" />
        <h2 className="text-xl font-extrabold text-brand-navy mb-1">Something went wrong</h2>
        <p className="text-muted text-sm mb-6">The app hit an unexpected error. A reload usually fixes it.</p>
        <button onClick={() => window.location.assign("/")}
          className="rounded-xl bg-brand-green text-white font-semibold px-8 py-3">Reload ROAMR</button>
      </div>
    );
  }
}
