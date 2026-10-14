import { BrowserRouter, Routes, Route } from "react-router-dom";
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/nearby-reports" element={<NearbyReports />} />
        <Route path="/home" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/register" element={<Auth register={true} />} />
        <Route path="/emergency" element={<Emergency />} />
        <Route path="/emergency-sos" element={<EmergencySOS />} />
        <Route path="/imsafe" element={<Imsafe />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/route-safety" element={<RouteSafety />} />
        <Route path="/trusted-contact" element={<Trustedcontact />} />
        <Route path="/report" element={<ReportForm />} />
        <Route path="/safe-places" element={<SafePlaces />} />
        <Route path="/map" element={<SafePlaces />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App; 