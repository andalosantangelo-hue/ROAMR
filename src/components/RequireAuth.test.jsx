import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import RequireAuth from "./RequireAuth.jsx";
import { useAuth } from "../store/AuthContext.jsx";

vi.mock("../store/AuthContext.jsx", () => ({
  useAuth: vi.fn(),
  needsOnboarding: (d) => !d?.displayName || !(d?.interests || []).length,
}));

const onboarded = { displayName: "Sam", interests: ["hiking"] };

// Renders a protected page at `path` and reports where the guard sent us.
function visit(path, auth) {
  vi.mocked(useAuth).mockReturnValue({ user: { uid: "u1" }, loading: false, profileStatus: "ready", ...auth });
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<p>login page</p>} />
        <Route path="/onboarding" element={<RequireAuth><p>onboarding page</p></RequireAuth>} />
        <Route path="*" element={<RequireAuth><p>protected page</p></RequireAuth>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("RequireAuth 18+ gate", () => {
  beforeEach(() => vi.mocked(useAuth).mockReset());

  it("sends a Google/Apple user who never gave a birth date to the age step, even with a full profile", () => {
    visit("/app/home", { profile: { ...onboarded } });
    expect(screen.getByText("onboarding page")).toBeInTheDocument();
    expect(screen.queryByText("protected page")).toBeNull();
  });

  it("blocks deep links (shared tribe invites) the same way", () => {
    visit("/tribe/abc123", { profile: { ...onboarded } });
    expect(screen.getByText("onboarding page")).toBeInTheDocument();
  });

  it("lets a confirmed, onboarded adult through", () => {
    visit("/app/home", { profile: { ...onboarded, ageConfirmed: true } });
    expect(screen.getByText("protected page")).toBeInTheDocument();
  });

  it("shows the loading screen, not the app, while the profile is still loading", () => {
    visit("/app/home", { profile: null, profileStatus: "loading" });
    expect(screen.getByRole("status", { name: "Loading ROAMR" })).toBeInTheDocument();
    expect(screen.queryByText("protected page")).toBeNull();
  });

  it("renders the onboarding page itself instead of redirecting in a loop", () => {
    visit("/onboarding", { profile: {} });
    expect(screen.getByText("onboarding page")).toBeInTheDocument();
  });

  it("sends signed-out visitors to login", () => {
    visit("/app/home", { user: null, profile: null });
    expect(screen.getByText("login page")).toBeInTheDocument();
  });
});
