
import React, { useState } from "react";
import {
  ArrowRight,
  Clock3,
  MapPin,
  Route,
  ShieldCheck,
  Sun,
  Moon,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Sparkles,
  Navigation,
  Lightbulb,
  Users,
  LockKeyhole,
} from "lucide-react";

import {
  calculateSafetyScore,
  getSafetyLevel,
} from "../utils/safetyScore";

import "./RouteSafety.css";

const routes = [
  {
    id: 1,
    name: "Route 1",
    from: "Dhanmondi",
    to: "Farmgate",
    travelTime: 25,
    distance: 6.2,
    crimeSafety: 90,
    lighting: 85,
    communityReports: 80,
    daySafety: 90,
    nightSafety: 65,
  },
  {
    id: 2,
    name: "Route 2",
    from: "Dhanmondi",
    to: "Farmgate",
    travelTime: 21,
    distance: 5.7,
    crimeSafety: 65,
    lighting: 70,
    communityReports: 60,
    daySafety: 75,
    nightSafety: 55,
  },
  {
    id: 3,
    name: "Route 3",
    from: "Dhanmondi",
    to: "Farmgate",
    travelTime: 18,
    distance: 5.2,
    crimeSafety: 35,
    lighting: 45,
    communityReports: 50,
    daySafety: 55,
    nightSafety: 30,
  },
];

function displayFactor(value) {
  if (
    value === null ||
    value === undefined ||
    typeof value !== "number" ||
    Number.isNaN(value)
  ) {
    return "Data unavailable";
  }

  return `${value}/100`;
}

function getSafetyClass(level) {
  if (level === "HIGH") return "high";
  if (level === "MEDIUM") return "medium";
  if (level === "LOW") return "low";
  return "unknown";
}

const factors = [
  {
    key: "crimeSafety",
    label: "Crime Safety",
    icon: LockKeyhole,
  },
  {
    key: "lighting",
    label: "Street Lighting",
    icon: Lightbulb,
  },
  {
    key: "communityReports",
    label: "Community Reports",
    icon: Users,
  },
  {
    key: "timeOfDay",
    label: "Time of Day Safety",
    icon: Clock3,
  },
];

export default function RouteSafety() {
  const [sortBy, setSortBy] = useState("fastest");
  const [timeContext, setTimeContext] = useState("day");
  const [expandedRoute, setExpandedRoute] = useState(null);

  const routesWithScores = routes.map((route) => {
    const timeOfDay =
      timeContext === "day"
        ? route.daySafety
        : route.nightSafety;

    const routeForCalculation = {
      ...route,
      timeOfDay,
    };

    return {
      ...routeForCalculation,
      safetyScore: calculateSafetyScore(routeForCalculation),
    };
  });

  const sortedRoutes = [...routesWithScores].sort((a, b) => {
    if (sortBy === "safest") {
      if (a.safetyScore === null && b.safetyScore === null) {
        return 0;
      }

      if (a.safetyScore === null) return 1;
      if (b.safetyScore === null) return -1;

      return b.safetyScore - a.safetyScore;
    }

    return a.travelTime - b.travelTime;
  });

  const toggleDetails = (routeId) => {
    setExpandedRoute((current) =>
      current === routeId ? null : routeId
    );
  };

  return (
    <main className="rs-page">
      <div className="rs-container">

        {/* HERO SECTION */}
        <section className="rs-hero">
          <div className="rs-hero-content">
            <div className="rs-eyebrow">
              <Sparkles size={17} />
              SMART ROUTE PLANNING
            </div>

            <h1>Find Your Safest Route</h1>

            <p>
              Compare available routes based on travel time,
              distance, and safety scores to make more
              informed travel decisions.
            </p>

            <div className="rs-hero-stats">
              <div className="rs-hero-stat">
                <Route size={22} />
                <div>
                  <strong>{routes.length} Routes</strong>
                  <span>Available options</span>
                </div>
              </div>

              <div className="rs-hero-stat">
                <ShieldCheck size={22} />
                <div>
                  <strong>Safety First</strong>
                  <span>Compare safety scores</span>
                </div>
              </div>

              <div className="rs-hero-stat">
                <Clock3 size={22} />
                <div>
                  <strong>Smart Travel</strong>
                  <span>Compare travel times</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rs-hero-decoration">
            <Navigation size={110} strokeWidth={1} />
          </div>
        </section>

        {/* FILTER SECTION */}
        <section className="rs-controls">
          <div className="rs-controls-title">
            <SlidersHorizontal size={20} />
            <span>Customize Your Journey</span>
          </div>

          <div className="rs-filter-grid">
            <div className="rs-filter">
              <label htmlFor="time-context">
                {timeContext === "day" ? (
                  <Sun size={18} />
                ) : (
                  <Moon size={18} />
                )}
                Travel Time
              </label>

              <select
                id="time-context"
                value={timeContext}
                onChange={(e) =>
                  setTimeContext(e.target.value)
                }
              >
                <option value="day">Day Travel</option>
                <option value="night">Night Travel</option>
              </select>
            </div>

            <div className="rs-filter">
              <label htmlFor="route-sort">
                <SlidersHorizontal size={18} />
                Sort Routes By
              </label>

              <select
                id="route-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="fastest">Fastest First</option>
                <option value="safest">Safest First</option>
              </select>
            </div>
          </div>
        </section>

        {/* CONTEXT NOTICE */}
        <div className="rs-context-notice">
          {timeContext === "day" ? (
            <Sun size={20} />
          ) : (
            <Moon size={20} />
          )}

          <span>
            Safety scores are currently calculated for{" "}
            <strong>
              {timeContext === "day"
                ? "Day Travel"
                : "Night Travel"}
            </strong>
            .
          </span>
        </div>

        {/* RESULTS HEADER */}
        <div className="rs-results-header">
          <div>
            <span className="rs-section-eyebrow">
              <MapPin size={15} />
              ROUTE COMPARISON
            </span>

            <h2>Available Routes</h2>
            <p>
              Explore your options and compare safety factors.
            </p>
          </div>

          <span className="rs-results-count">
            {sortedRoutes.length} Routes Found
          </span>
        </div>

        {/* ROUTE CARDS */}
        <div className="rs-route-list">
          {sortedRoutes.map((route, index) => {
            const safetyLevel = getSafetyLevel(
              route.safetyScore
            );

            const safetyClass = getSafetyClass(safetyLevel);
            const isExpanded = expandedRoute === route.id;

            const validScore =
              typeof route.safetyScore === "number" &&
              Number.isFinite(route.safetyScore);

            const progress = validScore
              ? Math.min(100, Math.max(0, route.safetyScore))
              : 0;

            return (
              <article
                key={route.id}
                className="rs-route-card"
              >
                <div className="rs-card-top">
                  <div className="rs-route-identity">
                    <div className="rs-route-icon">
                      <Route size={24} />
                    </div>

                    <div>
                      <span className="rs-route-order">
                        OPTION {index + 1}
                      </span>
                      <h3>{route.name}</h3>
                    </div>
                  </div>

                  <span
                    className={`rs-safety-badge ${safetyClass}`}
                  >
                    {safetyLevel === "UNKNOWN"
                      ? "SAFETY UNKNOWN"
                      : `${safetyLevel} SAFETY`}
                  </span>
                </div>

                <div className="rs-route-path">
                  <MapPin size={19} />
                  <strong>{route.from}</strong>
                  <ArrowRight size={18} />
                  <strong>{route.to}</strong>
                </div>

                <div className="rs-route-meta">
                  <span>
                    <Clock3 size={17} />
                    {route.travelTime} min
                  </span>

                  <span>
                    <Navigation size={17} />
                    {route.distance} km
                  </span>
                </div>

                {/* SAFETY SCORE */}
                <div className="rs-score-panel">
                  <div className="rs-score-top">
                    <div>
                      <span className="rs-score-label">
                        <ShieldCheck size={18} />
                        Safety Score
                      </span>

                      <small>
                        Based on four safety factors
                      </small>
                    </div>

                    <strong className={`rs-score-value ${safetyClass}`}>
                      {validScore
                        ? `${route.safetyScore}/100`
                        : "N/A"}
                    </strong>
                  </div>

                  <div
                    className="rs-progress-track"
                    role="progressbar"
                    aria-label={`${route.name} safety score`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={
                      validScore ? progress : undefined
                    }
                  >
                    <div
                      className={`rs-progress-fill ${safetyClass}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* DETAILS BUTTON */}
                <button
                  type="button"
                  className="rs-details-btn"
                  onClick={() => toggleDetails(route.id)}
                  aria-expanded={isExpanded}
                  aria-controls={`rs-details-${route.id}`}
                >
                  <ShieldCheck size={18} />

                  {isExpanded
                    ? "Hide Safety Details"
                    : "View Safety Details"}

                  {isExpanded ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </button>

                {/* EXPANDABLE BREAKDOWN */}
                {isExpanded && (
                  <div
                    className="rs-breakdown"
                    id={`rs-details-${route.id}`}
                  >
                    <h4>Safety Score Breakdown</h4>

                    <div className="rs-factor-list">
                      {factors.map((factor) => {
                        const Icon = factor.icon;
                        const value = route[factor.key];

                        const factorProgress =
                          typeof value === "number" &&
                          Number.isFinite(value)
                            ? Math.min(
                                100,
                                Math.max(0, value)
                              )
                            : 0;

                        return (
                          <div
                            key={factor.key}
                            className="rs-factor"
                          >
                            <div className="rs-factor-top">
                              <span>
                                <Icon size={17} />
                                {factor.label}
                                {factor.key === "timeOfDay"
                                  ? ` (${timeContext === "day" ? "Day" : "Night"})`
                                  : ""}
                              </span>

                              <strong>
                                {displayFactor(value)}
                              </strong>
                            </div>

                            <div className="rs-factor-track">
                              <div
                                className="rs-factor-fill"
                                style={{
                                  width: `${factorProgress}%`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="rs-breakdown-note">
                      <ShieldAlert size={18} />
                      <span>
                        Safety scores consider crime safety,
                        street lighting, community reports,
                        and time-of-day conditions.
                        These values are estimates,
                        not a guarantee of safety.
                      </span>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {/* FOOTER */}
        <div className="rs-footer-note">
          <ShieldCheck size={20} />
          <p>
            Stay aware of your surroundings and keep
            your trusted contacts informed during travel.
            These demonstration routes are not live navigation data.
          </p>
        </div>
      </div>
    </main>
  );
}
