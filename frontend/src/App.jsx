import { BrowserRouter, Routes, Route } from "react-router-dom";
import RouteSafety from "./pages/RouteSafety.jsx";
import Home from "./pages/Home.jsx";
import Auth from "./pages/Auth.jsx";
import Emergency from "./pages/Emergency.jsx";
import Imsafe from "./pages/Imsafe.jsx";
import Profile from "./pages/Profile.jsx";
import Trustedcontact from "./pages/Trustedcontact.jsx";
import ReportForm from "./components/ReportForm.jsx";
import EmergencySOS from "./components/EmergencySOS.jsx"; // 1. Component import kora hoyeche

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home */}
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />

        {/* Authentication */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/register" element={<Auth register={true} />} />

        {/* App Pages */}
        <Route path="/emergency" element={<EmergencySOS />} /> {/* 2. EmergencySOS route-e set kora hoyeche */}
        <Route path="/imsafe" element={<Imsafe />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/route-safety" element={<RouteSafety />} />
        <Route
          path="/trusted-contact"
          element={<Trustedcontact />}
        />

        {/* Incident Report */}
        <Route path="/report" element={<ReportForm />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;  