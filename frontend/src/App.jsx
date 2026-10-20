
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

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
function AppContent() {
  const location = useLocation();

  return (
    <>
      {location.pathname !== "/" && <Navbar />}

      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/home" element={<Home />} />
        <Route path="/helplines" element={<Helplines />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/register" element={<Auth register={true} />} />

        <Route path="/emergency-sos" element={<EmergencySOS />} />
        <Route path="/imsafe" element={<Imsafe />} />

        <Route path="/profile" element={<Profile />} />
        <Route path="/about" element={<About />} />
        <Route path="/trusted-contact" element={<Trustedcontact />} />
 
        <Route path="/report" element={<ReportForm />} />
        <Route path="/nearby-reports" element={<NearbyReports />} />

        <Route path="/safe-places" element={<SafePlaces />} />
        <Route path="/map" element={<SafePlaces />} />
        <Route path="/route-safety" element={<RouteSafety />} />

        <Route path="/admin/reports" element={<AdminDashboard />} />
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
