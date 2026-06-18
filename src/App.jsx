import { Routes, Route, Navigate } from "react-router-dom";
import PhoneFrame from "./components/PhoneFrame.jsx";
import TabsLayout from "./components/TabsLayout.jsx";
import Splash from "./screens/Splash.jsx";
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
import About from "./screens/About.jsx";
import HelpCenter from "./screens/HelpCenter.jsx";
import Guides from "./screens/Guides.jsx";
import TribeDetail from "./screens/TribeDetail.jsx";
import Messages from "./screens/Messages.jsx";
import Chat from "./screens/Chat.jsx";
import HelpBot from "./screens/HelpBot.jsx";
import SafetyCenter from "./screens/SafetyCenter.jsx";
import Verify from "./screens/Verify.jsx";
import EmergencyInfo from "./screens/EmergencyInfo.jsx";
import SafetyControls from "./screens/SafetyControls.jsx";
import Waiver from "./screens/Waiver.jsx";
import TripPlanForm from "./screens/TripPlanForm.jsx";
import TripPlans from "./screens/TripPlans.jsx";
import LeaveReview from "./screens/LeaveReview.jsx";
import { TribesProvider } from "./store/TribesContext.jsx";
import { AuthProvider } from "./store/AuthContext.jsx";
import { PostsProvider } from "./store/PostsContext.jsx";
import { ActivitiesProvider } from "./store/ActivitiesContext.jsx";
import { ListingsProvider } from "./store/ListingsContext.jsx";
import { MessagesProvider } from "./store/MessagesContext.jsx";
import { SafetyProvider } from "./store/SafetyContext.jsx";
import RequireAuth from "./components/RequireAuth.jsx";
import OfflineBanner from "./components/OfflineBanner.jsx";
import ConsentBanner from "./components/ConsentBanner.jsx";

export default function App() {
  return (
    <AuthProvider>
    <TribesProvider>
    <PostsProvider>
    <ActivitiesProvider>
    <ListingsProvider>
    <MessagesProvider>
    <SafetyProvider>
    <PhoneFrame>
      <OfflineBanner />
      <ConsentBanner />
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
        <Route path="/about" element={<RequireAuth><About /></RequireAuth>} />
        <Route path="/help" element={<RequireAuth><HelpCenter /></RequireAuth>} />
        <Route path="/help/bot" element={<RequireAuth><HelpBot /></RequireAuth>} />
        <Route path="/guides" element={<RequireAuth><Guides /></RequireAuth>} />
        <Route path="/tribe/:id" element={<RequireAuth><TribeDetail /></RequireAuth>} />
        <Route path="/messages" element={<RequireAuth><Messages /></RequireAuth>} />
        <Route path="/chat/:threadId" element={<RequireAuth><Chat /></RequireAuth>} />
        <Route path="/safety" element={<RequireAuth><SafetyCenter /></RequireAuth>} />
        <Route path="/safety/verify" element={<RequireAuth><Verify /></RequireAuth>} />
        <Route path="/safety/emergency" element={<RequireAuth><EmergencyInfo /></RequireAuth>} />
        <Route path="/safety/controls" element={<RequireAuth><SafetyControls /></RequireAuth>} />
        <Route path="/safety/waiver" element={<RequireAuth><Waiver /></RequireAuth>} />
        <Route path="/safety/new-trip" element={<RequireAuth><TripPlanForm /></RequireAuth>} />
        <Route path="/safety/trips" element={<RequireAuth><TripPlans /></RequireAuth>} />
        <Route path="/review/:uid" element={<RequireAuth><LeaveReview /></RequireAuth>} />
        <Route path="/u/:uid" element={<RequireAuth><PublicProfile /></RequireAuth>} />
        <Route path="/invite/:type/:id" element={<RequireAuth><Invite /></RequireAuth>} />
        <Route path="/notifications" element={<RequireAuth><Notifications /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PhoneFrame>
    </SafetyProvider>
    </MessagesProvider>
    </ListingsProvider>
    </ActivitiesProvider>
    </PostsProvider>
    </TribesProvider>
    </AuthProvider>
  );
}
