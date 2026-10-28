import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SkeletonRegion, PostCardSkeleton } from "./index.js";
import ChatThread from "../ChatThread.jsx";
import Home from "../../screens/Home.jsx";
import { usePosts } from "../../store/PostsContext.jsx";

// Home's data comes from contexts; stub them so the test drives `loading` directly.
vi.mock("../../store/PostsContext.jsx", () => ({ usePosts: vi.fn() }));
vi.mock("../../store/AuthContext.jsx", () => ({
  useAuth: () => ({ user: { uid: "me" }, profile: {}, followingIds: new Set(["a", "b", "c", "d", "e"]) }),
}));
vi.mock("../../store/FeedScopeContext.jsx", () => ({ useFeedScope: () => ({ scope: "foryou" }) }));
vi.mock("../Discover.jsx", () => ({ default: () => null }));
vi.mock("../PostCard.jsx", () => ({ default: ({ post }) => <article>{post.title}</article> }));

describe("skeleton primitives", () => {
  it("announce one labelled busy region and hide the shapes from screen readers", () => {
    const { container } = render(<SkeletonRegion label="Loading posts"><PostCardSkeleton /></SkeletonRegion>);
    const region = screen.getByRole("status", { name: "Loading posts" });
    expect(region).toHaveAttribute("aria-busy", "true");
    const shapes = container.querySelectorAll(".skeleton");
    expect(shapes.length).toBeGreaterThan(5);
    shapes.forEach((s) => expect(s.closest("[aria-hidden='true']")).not.toBeNull());
  });
});

describe("Home feed", () => {
  beforeEach(() => vi.mocked(usePosts).mockReset());

  it("shows post skeletons while loading", () => {
    vi.mocked(usePosts).mockReturnValue({ posts: [], loading: true });
    render(<Home />);
    expect(screen.getByRole("status", { name: "Loading posts" })).toBeInTheDocument();
    expect(screen.queryByText(/your feed's quiet/i)).not.toBeInTheDocument();
  });

  it("swaps to real posts once loaded", () => {
    vi.mocked(usePosts).mockReturnValue({ posts: [{ id: "p1", title: "Sunrise on Longs Peak" }], loading: false });
    render(<Home />);
    expect(screen.getByText("Sunrise on Longs Peak")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows the empty state (not a skeleton) when loaded with zero posts", () => {
    vi.mocked(usePosts).mockReturnValue({ posts: [], loading: false });
    render(<Home />);
    expect(screen.getByText(/your feed's quiet/i)).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});

describe("ChatThread", () => {
  beforeEach(() => { Element.prototype.scrollIntoView = vi.fn(); }); // not implemented in jsdom

  it("shows placeholder bubbles while loading, then the empty prompt", () => {
    const { rerender } = render(<ChatThread loading meUid="me" onSend={() => {}} />);
    expect(screen.getByRole("status", { name: "Loading messages" })).toBeInTheDocument();
    expect(screen.queryByText(/no messages yet/i)).not.toBeInTheDocument();
    rerender(<ChatThread messages={[]} meUid="me" onSend={() => {}} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByText(/no messages yet/i)).toBeInTheDocument();
  });
});
