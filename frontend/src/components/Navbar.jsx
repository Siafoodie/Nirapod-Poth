
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

const navigationLinks = [
  { label: "Home", path: "/home" },
  { label: "Emergency", path: "/emergency" },
  { label: "Emergency SOS", path: "/emergency-sos" },
  { label: "I'm Safe", path: "/imsafe" },
  { label: "Report Incident", path: "/report" },
  { label: "Nearby Reports", path: "/nearby-reports" },
  { label: "Safe Places", path: "/safe-places" },
  { label: "Route Safety", path: "/route-safety" },
  { label: "Trusted Contacts", path: "/trusted-contact" },
  { label: "Profile", path: "/profile" },
  { label: "Helplines", path: "/helplines" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Hide the navigation menu on authentication pages.
  if (["/auth", "/login", "/register"].includes(location.pathname)) {
    return null;
  }

  return (
    <nav style={styles.navbar}>
      <NavLink to="/home" style={styles.logo}> 
        Nirapod Poth
      </NavLink>

      <button
        type="button"
        onClick={() => setMenuOpen(!menuOpen)}
        style={styles.menuButton}
        aria-expanded={menuOpen}
        aria-label="Toggle navigation menu"
      >
        {menuOpen ? "Close Menu" : "☰ Menu"}
      </button>

      {menuOpen && (
        <div style={styles.menu}>
          {navigationLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              onClick={() => setMenuOpen(false)}
              style={({ isActive }) => ({
                ...styles.link,
                ...(isActive ? styles.activeLink : {}),
              })}
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
}

const styles = {
  navbar: {
    backgroundColor: "#5026bb",
    padding: "14px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    position: "relative",
    zIndex: 1000,
  },
  logo: {
    color: "#ffffff",
    textDecoration: "none",
    fontSize: "22px",
    fontWeight: "bold",
  },
  menuButton: {
    backgroundColor: "#ffffff",
    color: "#633ba5",
    border: "none",
    borderRadius: "6px",
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  
  menu: {
    position: "absolute",
    top: "100%",
    right: "16px",
    width: "230px",
    maxHeight: "75vh",
    overflowY: "auto",
    backgroundColor: "#ffffff",
    boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
    borderRadius: "8px",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
  },
  link: {
    color: "#020008",
    textDecoration: "none",
    padding: "11px 14px",
    borderRadius: "5px",
    fontSize: "14px",
  },
  activeLink: {
    backgroundColor: "#a294f1",
    fontWeight: "bold",
  },
};
