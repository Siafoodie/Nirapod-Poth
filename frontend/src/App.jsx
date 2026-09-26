import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home.jsx";
import Auth from "./pages/Auth.jsx";
import Emergency from "./pages/Emergency.jsx";
import Imsafe from "./pages/Imsafe.jsx";
import Profile from "./pages/Profile.jsx";
import Trustedcontact from "./pages/Trustedcontact.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/emergency" element={<Emergency />} />
        <Route path="/imsafe" element={<Imsafe />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/trusted-contact" element={<Trustedcontact />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;