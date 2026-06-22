import { createContext, useContext, useEffect, useState } from "react";
import { isScope } from "../lib/feed.js";

// Which feed scope the user has chosen in the top-bar dropdown, shared across
// Home / Activities / Tribes and remembered between sessions.
const FeedScopeContext = createContext(null);
const KEY = "roamr.feedScope";

export function FeedScopeProvider({ children }) {
  const [scope, setScopeState] = useState(() => {
    try { const s = localStorage.getItem(KEY); if (s && isScope(s)) return s; } catch { /* ignore */ }
    return "foryou";
  });
  const setScope = (s) => { if (isScope(s)) setScopeState(s); };
  useEffect(() => { try { localStorage.setItem(KEY, scope); } catch { /* ignore */ } }, [scope]);
  return (
    <FeedScopeContext.Provider value={{ scope, setScope }}>
      {children}
    </FeedScopeContext.Provider>
  );
}

export const useFeedScope = () =>
  useContext(FeedScopeContext) || { scope: "foryou", setScope: () => {} };
