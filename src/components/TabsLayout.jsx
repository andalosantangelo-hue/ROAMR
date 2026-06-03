import { Outlet, useLocation, useNavigate } from "react-router-dom";
import BottomNav from "./BottomNav.jsx";
import StatusBar from "./StatusBar.jsx";
import TopBar from "./TopBar.jsx";
import Fab from "./Fab.jsx";
import VerifyBanner from "./VerifyBanner.jsx";

const FEED_TABS = ["/app/home", "/app/activities", "/app/tribes"];
const FAB_TABS = [...FEED_TABS, "/app/marketplace"];

export default function TabsLayout() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const isFeed = FEED_TABS.includes(pathname);
  const showFab = FAB_TABS.includes(pathname);

  const onFab = () => {
    if (pathname === "/app/tribes") nav("/create-tribe");
    else if (pathname === "/app/home") nav("/create-post");
    else if (pathname === "/app/activities") nav("/create-activity");
    else if (pathname === "/app/marketplace") nav("/create-listing");
    else nav("/create-tribe");
  };

  return (
    <div className={`relative flex flex-col h-full ${isFeed ? "bg-brand-tint" : "bg-white"}`}>
      <StatusBar />
      {isFeed && <TopBar />}
      <VerifyBanner />
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <Outlet />
      </div>
      {showFab && <div className="absolute right-4 bottom-[92px]"><Fab onClick={onFab} /></div>}
      <BottomNav />
    </div>
  );
}
