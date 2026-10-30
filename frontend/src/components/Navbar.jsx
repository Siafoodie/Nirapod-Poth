import React, { useState, useEffect, useRef } from "react";

import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  Menu,
  X,
  House,
  Siren,
  ShieldCheck,
  FileWarning,
  MapPin,
  Map,
  Route,
  Users,
  UserRound,
  PhoneCall,
  ChevronRight,
  Sparkles,
  LogOut,
  LayoutDashboard,
} from "lucide-react";

import { clearStoredUser } from "../utils/userStorage";
import { API_BASE_URL } from "../api";
import "./Navbar.css";

// =====================================
// CURRENT USER
// =====================================

function getCurrentUser() {
  try {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
}

// =====================================
// PROFILE IMAGE URL
// =====================================

function getProfileImageUrl(path) {
  if (!path) return "";

  if (/^(https?:\/\/|data:|blob:)/i.test(path)) {
    return path;
  }

  const server = String(API_BASE_URL || "")
    .replace(/\/api\/?$/, "")
    .replace(/\/$/, "");

  return `${server}/${String(path).replace(/^\/+/, "")}`;
}

// =====================================
// USER MENU ITEMS
// =====================================

const userMenuItems = [
  {
    label: "Home",
    path: "/home",
    icon: House,
  },
  {
    label: "Emergency SOS",
    path: "/emergency-sos",
    icon: Siren,
  },
  {
    label: "I'm Safe",
    path: "/imsafe",
    icon: ShieldCheck,
  },
  {
    label: "Report Incident",
    path: "/report",
    icon: FileWarning,
  },
  {
    label: "Nearby Reports",
    path: "/nearby-reports",
    icon: MapPin,
  },
  {
    label: "Safe Places",
    path: "/safe-places",
    icon: Map,
  },
  {
    label: "Route Safety",
    path: "/route-safety",
    icon: Route,
  },
  {
    label: "Trusted Contacts",
    path: "/trusted-contact",
    icon: Users,
  },
  {
    label: "Helplines",
    path: "/helplines",
    icon: PhoneCall,
  },
];

// =====================================
// ADMIN MENU ITEMS
// =====================================

const adminMenuItems = [
  {
    label: "Admin Dashboard",
    path: "/admin/reports",
    icon: LayoutDashboard,
  },
  {
    label: "My Profile",
    path: "/profile",
    icon: UserRound,
  },
];

// =====================================
// MOBILE BOTTOM NAVIGATION
// =====================================

const mobileNavItems = [
  {
    label: "Home",
    path: "/home",
    icon: House,
  },
  {
    label: "Places",
    path: "/safe-places",
    icon: MapPin,
  },
  {
    label: "SOS",
    path: "/emergency-sos",
    icon: Siren,
  },
  {
    label: "Reports",
    path: "/nearby-reports",
    icon: FileWarning,
  },
  {
    label: "Profile",
    path: "/profile",
    icon: UserRound,
  },
];

const adminMobileNavItems = [
  {
    label: "Dashboard",
    path: "/admin/reports",
    icon: LayoutDashboard,
  },
  {
    label: "Profile",
    path: "/profile",
    icon: UserRound,
  },
];

// =====================================
// NAVBAR COMPONENT
// =====================================

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState(
    getCurrentUser
  );

  const [avatarFailed, setAvatarFailed] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const toggleRef = useRef(null);
  const panelRef = useRef(null);

  // =====================================
  // ADMIN DETECTION
  // =====================================

  const isAdmin =
    String(currentUser?.role || "")
      .trim()
      .toLowerCase() === "admin";

  const visibleMenuItems = isAdmin
    ? adminMenuItems
    : userMenuItems;

  const bottomItems = isAdmin
    ? adminMobileNavItems
    : mobileNavItems;

  const homePath = isAdmin
    ? "/admin/reports"
    : "/home";

  // =====================================
  // PROFILE INFORMATION
  // =====================================

  const displayName =
    currentUser?.name ||
    currentUser?.username ||
    "My Profile";

  const profileImage =
    currentUser?.avatarUrl ||
    currentUser?.avatar ||
    currentUser?.profileImage ||
    null;

  const avatarUrl = getProfileImageUrl(profileImage);

  // =====================================
  // HIDE BOTTOM NAV ON SPECIAL PAGES
  // =====================================

  const hiddenBottomRoutes = [
    "/",
    "/auth",
    "/login",
    "/register",
  ];

  const hideBottomNav =
    hiddenBottomRoutes.includes(location.pathname) ||
    location.pathname.startsWith("/live/");

  // =====================================
  // SYNCHRONIZE USER
  // =====================================

  useEffect(() => {
    const syncUser = () => {
      setCurrentUser(getCurrentUser());
    };

    window.addEventListener("storage", syncUser);
    window.addEventListener("focus", syncUser);

    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("focus", syncUser);
    };
  }, []);

  // =====================================
  // RESET AVATAR
  // =====================================

  useEffect(() => {
    setAvatarFailed(false);
  }, [avatarUrl]);

  // =====================================
  // CLOSE MENU ON ROUTE CHANGE
  // =====================================

  useEffect(() => {
    setMenuOpen(false);
    setCurrentUser(getCurrentUser());
  }, [location.pathname]);

  // =====================================
  // ESCAPE KEY SUPPORT
  // =====================================

  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [menuOpen]);

  // =====================================
  // FOCUS SIDEBAR
  // =====================================

  useEffect(() => {
    if (menuOpen) {
      panelRef.current?.querySelector("a")?.focus();
    }
  }, [menuOpen]);

  // =====================================
  // SIGN OUT
  // =====================================

  const handleSignOut = () => {
    try {
      clearStoredUser();

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      setCurrentUser(null);
      setAvatarFailed(false);
      setMenuOpen(false);

      navigate("/", { replace: true });
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const closeMenu = () => {
    setMenuOpen(false);
    toggleRef.current?.focus();
  };

  // =====================================
  // RENDER
  // =====================================

  return (
    <>
      {/* =====================================
          MAIN HEADER
      ===================================== */}

      <header className="np-nav-header">
        <Link
          to={homePath}
          className="np-nav-brand"
          onClick={() => setMenuOpen(false)}
        >
          <img
            src="/nirapod-logo.png"
            alt="Nirapod Poth Logo"
          />

          <div className="np-nav-brand-text">
            <strong>
              NIRAPOD <span>POTH</span>
            </strong>

            <small>
              {isAdmin
                ? "Administration Panel"
                : "Your Safety Companion"}
            </small>
          </div>
        </Link>

        {/* HAMBURGER BUTTON */}

        <button
          ref={toggleRef}
          type="button"
          className={`np-nav-toggle ${
            menuOpen ? "open" : ""
          }`}
          aria-label={
            menuOpen ? "Close menu" : "Open menu"
          }
          aria-expanded={menuOpen}
          aria-controls="np-sidebar"
          onClick={() =>
            setMenuOpen((previous) => !previous)
          }
        >
          {menuOpen ? (
            <X size={21} />
          ) : (
            <Menu size={21} />
          )}

          <span>
            {menuOpen ? "Close Menu" : "Explore Menu"}
          </span>
        </button>
      </header>

      {/* =====================================
          BACKDROP
      ===================================== */}

      {menuOpen && (
        <button
          className="np-nav-backdrop"
          type="button"
          aria-label="Close navigation menu"
          onClick={closeMenu}
        />
      )}

      {/* =====================================
          SIDEBAR
      ===================================== */}

      <aside
        ref={panelRef}
        id="np-sidebar"
        className={`np-nav-sidebar ${
          menuOpen ? "show" : ""
        }`}
        aria-label="Main navigation"
        aria-hidden={!menuOpen}
        inert={!menuOpen}
      >
        {/* SIDEBAR HEADER */}

        <div className="np-nav-sidebar-top">
          <div className="np-nav-sidebar-title">
            <Sparkles size={16} />

            <span>
              {isAdmin
                ? "ADMIN PANEL"
                : "MY NIRAPOD POTH"}
            </span>
          </div>

          <button
            type="button"
            className="np-nav-close"
            aria-label="Close sidebar"
            onClick={closeMenu}
          >
            <X size={18} />
          </button>
        </div>

        {/* =====================================
            PROFILE CARD
        ===================================== */}

        <Link
          to="/profile"
          className="np-profile-card"
          onClick={() => setMenuOpen(false)}
        >
          <div className="np-profile-avatar">
            {avatarUrl && !avatarFailed ? (
              <img
                src={avatarUrl}
                alt={`${displayName} profile`}
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <UserRound
                size={27}
                className="np-profile-fallback"
              />
            )}
          </div>

          <div className="np-profile-details">
            <strong>{displayName}</strong>

            <span>
              {isAdmin
                ? "Administrator Account"
                : "Personal Account"}
            </span>

            <small>
              View Profile
              <ChevronRight size={13} />
            </small>
          </div>

          <ChevronRight
            className="np-profile-right-arrow"
            size={19}
          />
        </Link>

        {/* =====================================
            NAVIGATION LABEL
        ===================================== */}

        <div className="np-menu-section-label">
          {isAdmin
            ? "ADMIN NAVIGATION"
            : "QUICK NAVIGATION"}
        </div>

        {/* =====================================
            SIDEBAR LINKS
        ===================================== */}

        <nav
          className="np-nav-list"
          aria-label="Sidebar links"
        >
          {visibleMenuItems.map(
            ({ label, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `np-nav-link ${
                    isActive ? "active" : ""
                  }`
                }
              >
                <span className="np-nav-link-icon">
                  <Icon
                    size={19}
                    strokeWidth={1.9}
                  />
                </span>

                <span className="np-nav-link-label">
                  {label}
                </span>

                <ChevronRight
                  size={16}
                  className="np-nav-arrow"
                />
              </NavLink>
            )
          )}
        </nav>

        {/* =====================================
            SIDEBAR BOTTOM
        ===================================== */}

        <div className="np-nav-sidebar-bottom">
          <button
            type="button"
            className="np-nav-signout"
            onClick={handleSignOut}
          >
            <span className="np-nav-signout-left">
              <LogOut size={20} />
              <span>Sign Out</span>
            </span>

            <ChevronRight size={17} />
          </button>

          <div className="np-nav-sidebar-footer">
            <ShieldCheck size={22} />

            <div>
              <strong>
                {isAdmin
                  ? "Manage reports responsibly."
                  : "Stay aware. Stay connected."}
              </strong>

              <small>
                {isAdmin
                  ? "Nirapod Poth Administration"
                  : "Your journey matters 💜"}
              </small>
            </div>
          </div>
        </div>
      </aside>

      {/* =====================================
          MOBILE BOTTOM NAVIGATION
      ===================================== */}

      {!hideBottomNav && (
        <nav
          className="np-mobile-bottom-nav"
          aria-label="Mobile navigation"
        >
          {bottomItems.map(
            ({ label, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `np-mobile-nav-item ${
                    isActive ? "active" : ""
                  } ${
                    path === "/emergency-sos"
                      ? "np-mobile-sos"
                      : ""
                  }`
                }
              >
                <Icon
                  size={22}
                  strokeWidth={1.9}
                  aria-hidden="true"
                />

                <span>{label}</span>
              </NavLink>
            )
          )}
        </nav>
      )}
    </>
  );
}