import { Routes, Route, Navigate } from "react-router-dom";
import PhoneFrame from "./components/PhoneFrame.jsx";
import TabsLayout from "./components/TabsLayout.jsx";
import Splash from "./screens/Splash.jsx";
import Placeholder from "./screens/Placeholder.jsx";
import Login from "./screens/Login.jsx";
import Onboarding from "./screens/Onboarding.jsx";
import Home from "./screens/Home.jsx";
import Activities from "./screens/Activities.jsx";
import Tribes from "./screens/Tribes.jsx";
import Marketplace from "./screens/Marketplace.jsx";
import Premium from "./screens/Premium.jsx";
import Profile from "./screens/Profile.jsx";
import CreateTribe from "./screens/CreateTribe.jsx";
import EditProfile from "./screens/EditProfile.jsx";
import ComposePost from "./screens/ComposePost.jsx";
import ComposeActivity from "./screens/ComposeActivity.jsx";
import Comments from "./screens/Comments.jsx";
import CreateListing from "./screens/CreateListing.jsx";
import ListingDetail from "./screens/ListingDetail.jsx";
import Settings from "./screens/Settings.jsx";
import PublicProfile from "./screens/PublicProfile.jsx";
import Invite from "./screens/Invite.jsx";
import Notifications from "./screens/Notifications.jsx";
import { TribesProvider } from "./store/TribesContext.jsx";
import { AuthProvider } from "./store/AuthContext.jsx";
import { PostsProvider } from "./store/PostsContext.jsx";
import { ActivitiesProvider } from "./store/ActivitiesContext.jsx";
import { ListingsProvider } from "./store/ListingsContext.jsx";
import RequireAuth from "./components/RequireAuth.jsx";
import OfflineBanner from "./components/OfflineBanner.jsx";

export default function App() {
  return (
    <AuthProvider>
    <TribesProvider>
    <PostsProvider>
    <ActivitiesProvider>
    <ListingsProvider>
    <PhoneFrame>
      <OfflineBanner />
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/app" element={<RequireAuth><TabsLayout /></RequireAuth>}>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<Home />} />
          <Route path="activities" element={<Activities />} />
          <Route path="tribes" element={<Tribes />} />
          <Route path="marketplace" element={<Marketplace />} />
          <Route path="premium" element={<Premium />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="/create-tribe" element={<RequireAuth><CreateTribe /></RequireAuth>} />
        <Route path="/edit-profile" element={<RequireAuth><EditProfile /></RequireAuth>} />
        <Route path="/create-post" element={<RequireAuth><ComposePost /></RequireAuth>} />
        <Route path="/create-activity" element={<RequireAuth><ComposeActivity /></RequireAuth>} />
        <Route path="/comments/:type/:id" element={<RequireAuth><Comments /></RequireAuth>} />
        <Route path="/create-listing" element={<RequireAuth><CreateListing /></RequireAuth>} />
        <Route path="/listing/:id" element={<RequireAuth><ListingDetail /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
        <Route path="/u/:uid" element={<RequireAuth><PublicProfile /></RequireAuth>} />
        <Route path="/invite/:type/:id" element={<RequireAuth><Invite /></RequireAuth>} />
        <Route path="/notifications" element={<RequireAuth><Notifications /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PhoneFrame>
    </ListingsProvider>
    </ActivitiesProvider>
    </PostsProvider>
    </TribesProvider>
    </AuthProvider>
  );
}
