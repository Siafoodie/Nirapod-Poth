import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home.jsx";
import Auth from "./pages/Auth.jsx";
import Emergency from "./pages/Emergency.jsx";
import Imsafe from "./pages/Imsafe.jsx";
import Profile from "./pages/Profile.jsx";
import Trustedcontact from "./pages/Trustedcontact.jsx";
import ReportForm from "./components/ReportForm.jsx";

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
        <Route path="/emergency" element={<Emergency />} />
        <Route path="/imsafe" element={<Imsafe />} />
        <Route path="/profile" element={<Profile />} />
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