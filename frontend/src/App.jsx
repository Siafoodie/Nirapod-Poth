
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Helplines from "./pages/Helplines.jsx";
import RouteSafety from "./pages/RouteSafety.jsx";
import Home from "./pages/Home.jsx";
import Auth from "./pages/Auth.jsx";
import Emergency from "./pages/Emergency.jsx";
import Imsafe from "./pages/Imsafe.jsx";
import Profile from "./pages/Profile.jsx";
import Trustedcontact from "./pages/Trustedcontact.jsx";
import ReportForm from "./components/ReportForm.jsx";
import SafePlaces from "./pages/SafePlaces.jsx";
import EmergencySOS from "./components/EmergencySOS.jsx";
import NearbyReports from "./pages/NearbyReports.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import Navbar from "./components/Navbar.jsx";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
<Route path="/helplines" element={<Helplines />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/register" element={<Auth register={true} />} />

        <Route path="/emergency" element={<Emergency />} />
        <Route path="/emergency-sos" element={<EmergencySOS />} />
        <Route path="/imsafe" element={<Imsafe />} />

        <Route path="/profile" element={<Profile />} />
        <Route path="/trusted-contact" element={<Trustedcontact />} />

        <Route path="/report" element={<ReportForm />} />
        <Route path="/nearby-reports" element={<NearbyReports />} />

        <Route path="/safe-places" element={<SafePlaces />} />
        <Route path="/map" element={<SafePlaces />} />
        <Route path="/route-safety" element={<RouteSafety />} />

        <Route
          path="/admin/reports"
          element={<AdminDashboard />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
