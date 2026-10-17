import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import useGeolocation from "../hooks/useGeolocation";
import { api } from "../api";
import LanguageSwitcher from "../components/LanguageSwitcher";
import {
  AlertTriangle,
  Check,
  Crosshair,
  MapPin,
  Phone,
  Search,
  Shield,
  Navigation,
  User,
} from "lucide-react";

function scoreArea(reportCount) {
  if (reportCount >= 8) {
    return {
      level: "HIGH",
      label: "High risk",
      hint: "Several recent reports nearby. Prefer well-lit routes and stay alert.",
      color: "#dc2626",
      bg: "#fef2f2",
      scoreText: "3.2",
    };
  }
  if (reportCount >= 3) {
    return {
      level: "MEDIUM",
      label: "Medium risk",
      hint: "Some recent reports in this area. Stay aware and share your trip.",
      color: "#d97706",
      bg: "#fffbeb",
      scoreText: "6.4",
    };
  }
  if (reportCount === 0) {
    return {
      level: "UNKNOWN",
      label: "No reports yet",
      hint: "No incident reports found for this area yet. Proceed with caution and keep trusted contacts ready.",
      color: "#7c3aed",
      bg: "#f5f3ff",
      scoreText: "—",
    };
  }
  return {
    level: "LOW",
    label: "Low risk",
    hint: "Few recent reports nearby. Still keep trusted contacts ready.",
    color: "#16a34a",
    bg: "#f0fdf4",
    scoreText: "8.6",
  };
}

export default function Home() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { getCurrentPosition, loading: locating } = useGeolocation();

  const [manualQuery, setManualQuery] = useState("");
  const [areaLabel, setAreaLabel] = useState("Dhaka");
  const [reportCount, setReportCount] = useState(0);
  const [loadingScore, setLoadingScore] = useState(false);
  const [error, setError] = useState("");
  const [selectedAction, setSelectedAction] = useState("");
  const [userLabel, setUserLabel] = useState("");

  const safety = useMemo(() => scoreArea(reportCount), [reportCount]);
  const greeting = () => {
    const h = new Date().getHours();
    const morning = t("goodMorning");
    const afternoon = t("goodAfternoon");
    const evening = t("goodEvening");

    if (h < 12) {
      return !morning || morning === "goodMorning" ? "Good morning" : morning;
    }
    if (h < 18) {
      return !afternoon || afternoon === "goodAfternoon"
        ? "Good afternoon"
        : afternoon;
    }
    return !evening || evening === "goodEvening" ? "Good evening" : evening;
  }; 
  

  // Logged-in user (simple)
  useEffect(() => {
    try {
      const raw =
        localStorage.getItem("user") ||
        localStorage.getItem("nirapod_user");
      if (raw) {
        const u = JSON.parse(raw);
        setUserLabel(
          u.name || u.fullName || u.phone || u.email || u.id || "User"
        );
        return;
      }
      const phone = localStorage.getItem("phone");
      const token = localStorage.getItem("token");
      if (token && phone) setUserLabel(phone);
      else if (token) setUserLabel("Signed in");
    } catch {
      /* ignore */
    }
  }, []);

  const loadAreaScore = async (lat, lng, label) => {
    setLoadingScore(true);
    setError("");
    if (label) setAreaLabel(label);

    try {
      const res = await api(
        `/reports/nearby?latitude=${lat}&longitude=${lng}&radiusKm=2`
      );
      const list = Array.isArray(res)
        ? res
        : res.data || res.reports || [];
      setReportCount(list.length);
    } catch (e) {
      setReportCount(0);
      setError(
        e.message || "Could not load area reports. Showing default safety."
      );
    } finally {
      setLoadingScore(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const pos = await getCurrentPosition();
        await loadAreaScore(
          pos.lat ?? pos.latitude,
          pos.lng ?? pos.longitude,
          "Current location"
        );
      } catch {
        await loadAreaScore(23.8103, 90.4125, "Dhaka (default)");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const useMyLocation = async () => {
    try {
      const pos = await getCurrentPosition();
      await loadAreaScore(
        pos.lat ?? pos.latitude,
        pos.lng ?? pos.longitude,
        "Current location"
      );
    } catch (e) {
      setError(e.message || "Location permission unavailable.");
    }
  };

  const searchManual = async (e) => {
    e.preventDefault();
    const q = manualQuery.trim();
    if (q.length < 2) {
      setError("Enter an area name (e.g. Mirpur, Gulshan).");
      return;
    }
    setLoadingScore(true);
    setError("");
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        q + ", Dhaka, Bangladesh"
      )}&limit=1`;
      const r = await fetch(url, { headers: { Accept: "application/json" } });
      const data = await r.json();
      if (!data?.length) {
        setError("Area not found. Try another name.");
        setLoadingScore(false);
        return;
      }
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      await loadAreaScore(lat, lng, data[0].display_name?.split(",")[0] || q);
    } catch {
      setError("Search failed. Check internet and try again.");
      setLoadingScore(false);
    }
  };

  const go = (key, path) => {
    setSelectedAction(key);
    navigate(path);
  };

  return (
    <div className="home-dash">
      {/* Top row: brand + language + profile */}
      <header className="home-dash-top">
        <div className="home-brand">
          <img src="/nirapod-logo.png" alt="" className="home-logo" />
          <span>Nirapod Poth</span>
        </div>
        <div className="home-top-right">
          <LanguageSwitcher />
          {userLabel && (
            <button
              type="button"
              className="home-user-chip"
              onClick={() => navigate("/profile")}
              title="Profile"
            >
              <User size={14} />
              <span>{userLabel}</span>
            </button>
          )}
        </div>
      </header>

      <section className="home-greet">
        <h1>
          {greeting()}
          <span className="home-wave"> ✿</span>
        </h1>
        <p className="home-sub">
          {t("homeTagline") === "homeTagline"
            ? "You are safer when you know your area."
            : t("homeTagline") || "You are safer when you know your area."}
        </p>
      </section>

      <form className="home-loc-form" onSubmit={searchManual}>
        <MapPin size={18} className="home-loc-icon" />
        <input
          type="search"
          placeholder="Enter area (Mirpur, Gulshan…)"
          value={manualQuery}
          onChange={(e) => setManualQuery(e.target.value)}
        />
        <button type="submit" className="home-loc-btn" disabled={loadingScore}>
          <Search size={16} />
        </button>
        <button
          type="button"
          className="home-loc-btn"
          onClick={useMyLocation}
          disabled={locating || loadingScore}
          title="Use my location"
        >
          <Crosshair size={16} />
        </button>
      </form>
      {error && <p className="home-error">{error}</p>}

      {/* Safety dashboard */}
      <section
        className="home-safety-card"
        style={{ background: safety.bg, borderColor: safety.color + "33" }}
      >
        <div className="home-safety-head">
          <div>
            <span className="home-safety-eyebrow">
              <Shield size={14} /> {t("areaSafety") || "Area Safety"}
            </span>
            <h2>{areaLabel}</h2>
            <small>
              {loadingScore
                ? "Checking recent reports…"
                : `${reportCount} report${reportCount === 1 ? "" : "s"} nearby (2 km)`}
            </small>
          </div>
          <div
            className="home-safety-badge"
            style={{ color: safety.color, borderColor: safety.color }}
          >
            <strong>{safety.level}</strong>
            <span>
              {safety.scoreText === "—" ? "N/A" : `${safety.scoreText}/10`}
            </span>
          </div>
        </div>

        <p className="home-safety-hint">{safety.hint}</p>

        {reportCount === 0 && !loadingScore && (
          <div className="home-caution">
            <AlertTriangle size={14} />
            <span>
              No reports in this area yet. That does not mean it is fully safe —
              proceed with caution.
            </span>
          </div>
        )}

        <div className="home-safety-actions">
          <button
            type="button"
            className="home-primary"
            onClick={() => navigate("/safe-places")}
          >
            <Navigation size={16} /> View safe places
          </button>
          <button
            type="button"
            className="home-ghost"
            onClick={() => navigate("/nearby-reports")}
          >
            View reports ›
          </button>
        </div>
      </section>

      <h3 className="home-section-title">
        {t("quickActions") || "Quick actions"}
      </h3>
      <div className="home-actions-grid">
        <button
          type="button"
          className={`home-action ${selectedAction === "imsafe" ? "selected" : ""}`}
          onClick={() => go("imsafe", "/imsafe")}
        >
          <Check size={20} />
          <span>{t("imSafe") || "I'm Safe"}</span>
          <small>Check-in</small>
        </button>
        <button
          type="button"
          className={`home-action home-action-sos ${selectedAction === "sos" ? "selected" : ""}`}
          onClick={() => go("sos", "/emergency-sos")}
        >
          <AlertTriangle size={20} />
          <span>SOS</span>
          <small>Emergency</small>
        </button>
        <button
          type="button"
          className={`home-action ${selectedAction === "map" ? "selected" : ""}`}
          onClick={() => go("map", "/safe-places")}
        >
          <MapPin size={20} />
          <span>Map</span>
          <small>Safe places</small>
        </button>
        <button
          type="button"
          className={`home-action ${selectedAction === "help" ? "selected" : ""}`}
          onClick={() => go("help", "/emergency")}
        >
          <Phone size={20} />
          <span>{t("helplines") || "Helplines"}</span>
          <small>999 / 109</small>
        </button>
      </div>

      <h3 className="home-section-title">Safety tools</h3>
      <div className="home-tools">
        <button
          type="button"
          className={selectedAction === "contacts" ? "selected" : ""}
          onClick={() => go("contacts", "/trusted-contact")}
        >
          Trusted contacts
        </button>
        <button
          type="button"
          className={selectedAction === "report" ? "selected" : ""}
          onClick={() => go("report", "/report")}
        >
          Report incident
        </button>
        <button
          type="button"
          className={selectedAction === "route" ? "selected" : ""}
          onClick={() => go("route", "/route-safety")}
        >
          Route safety
        </button>
        <button
          type="button"
          className={selectedAction === "profile" ? "selected" : ""}
          onClick={() => go("profile", "/profile")}
        >
          Profile
        </button>
      </div>
    </div>
  );
} 