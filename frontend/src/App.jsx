
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import Welcome from "./pages/Welcome.jsx";
import Helplines from "./pages/Helplines.jsx";
import RouteSafety from "./pages/RouteSafety.jsx";
import Home from "./pages/Home.jsx";
import Auth from "./pages/Auth.jsx";
import Imsafe from "./pages/Imsafe.jsx";
import Profile from "./pages/Profile.jsx";
import Trustedcontact from "./pages/Trustedcontact.jsx";
import ReportForm from "./components/ReportForm.jsx";
import SafePlaces from "./pages/SafePlaces.jsx";
import EmergencySOS from "./components/EmergencySOS.jsx";
import NearbyReports from "./pages/NearbyReports.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import Navbar from "./components/Navbar.jsx";
import About from "./pages/About.jsx";
import OfflineBanner from "./components/OfflineBanner";

// US-15: Live Location Viewer
import LiveLocationViewer from "./pages/LiveLocationViewer.jsx";

function AppContent() {
  const location = useLocation();

  const isWelcomePage = location.pathname === "/";

  return (
    <>
      {!isWelcomePage && <Navbar />}

      {/* US-14: Offline Queue Banner */}
      <OfflineBanner />

      <Routes>
        {/* Welcome */}
        <Route path="/" element={<Welcome />} />

        {/* Main Pages */}
        <Route path="/home" element={<Home />} />
        <Route path="/helplines" element={<Helplines />} />

        {/* Authentication */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/login" element={<Auth />} />
        <Route
          path="/register"
          element={<Auth register={true} />}
        />

        {/* Emergency SOS */}
        <Route
          path="/emergency-sos"
          element={<EmergencySOS />}
        />

        {/* I'm Safe */}
        <Route path="/imsafe" element={<Imsafe />} />

        {/* User Profile */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/about" element={<About />} />

        {/* Trusted Contacts */}
        <Route
          path="/trusted-contact"
          element={<Trustedcontact />}
        />

        {/* Incident Reports */}
        <Route path="/report" element={<ReportForm />} />
        <Route
          path="/nearby-reports"
          element={<NearbyReports />}
        />

        {/* Safe Places */}
        <Route path="/safe-places" element={<SafePlaces />} />
        <Route path="/map" element={<SafePlaces />} />

        {/* Route Safety */}
        <Route
          path="/route-safety"
          element={<RouteSafety />}
        />

        {/* Admin Dashboard */}
        <Route
          path="/admin/reports"
          element={<AdminDashboard />}
        />

        {/* US-15: Live Location Sharing Viewer */}
        <Route
          path="/live/:shareToken"
          element={<LiveLocationViewer />}
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
