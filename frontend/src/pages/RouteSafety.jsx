import React, { useState } from "react";
import {
  calculateSafetyScore,
  getSafetyLevel,
} from "../utils/safetyScore";

const RouteSafety = () => {
  const [sortBy, setSortBy] = useState("fastest");
  const [timeContext, setTimeContext] = useState("day");
  const [expandedRoute, setExpandedRoute] = useState(null);

  // Demo route data
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

  // Safety badge colors
  const getBadgeStyle = (level) => {
    if (level === "HIGH") {
      return {
        backgroundColor: "#dcfce7",
        color: "#166534",
      };
    }

    if (level === "MEDIUM") {
      return {
        backgroundColor: "#fef3c7",
        color: "#92400e",
      };
    }

    if (level === "LOW") {
      return {
        backgroundColor: "#fee2e2",
        color: "#991b1b",
      };
    }

    return {
      backgroundColor: "#e5e7eb",
      color: "#374151",
    };
  };

  // Show number or "Data unavailable"
  const displayFactor = (value) => {
    if (
      value === null ||
      value === undefined ||
      typeof value !== "number" ||
      Number.isNaN(value)
    ) {
      return "Data unavailable";
    }

    return `${value}/100`;
  };

  // Add current Day/Night value before calculating score
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

  // Sort routes
  const sortedRoutes = [...routesWithScores].sort((a, b) => {
    if (sortBy === "safest") {
      // Routes without score go to the bottom
      if (a.safetyScore === null && b.safetyScore === null) {
        return 0;
      }

      if (a.safetyScore === null) {
        return 1;
      }

      if (b.safetyScore === null) {
        return -1;
      }

      return b.safetyScore - a.safetyScore;
    }

    return a.travelTime - b.travelTime;
  });

  // Open / close safety details
  const toggleDetails = (routeId) => {
    if (expandedRoute === routeId) {
      setExpandedRoute(null);
    } else {
      setExpandedRoute(routeId);
    }
  };

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "40px 20px",
      }}
    >
      {/* Page Header */}
      <h1
        style={{
          marginBottom: "8px",
        }}
      >
        Safe Route Finder
      </h1>

      <p
        style={{
          color: "#666",
          marginBottom: "25px",
        }}
      >
        Compare available routes based on travel time and safety score.
      </p>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "15px",
          marginBottom: "20px",
        }}
      >
        {/* Day / Night */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <label
            htmlFor="time-context"
            style={{
              fontWeight: "600",
            }}
          >
            Travel Time:
          </label>

          <select
            id="time-context"
            value={timeContext}
            onChange={(e) => setTimeContext(e.target.value)}
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              backgroundColor: "#ffffff",
              fontSize: "15px",
              cursor: "pointer",
            }}
          >
            <option value="day">Day</option>
            <option value="night">Night</option>
          </select>
        </div>

        {/* Sort */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <label
            htmlFor="route-sort"
            style={{
              fontWeight: "600",
            }}
          >
            Sort By:
          </label>

          <select
            id="route-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              backgroundColor: "#ffffff",
              fontSize: "15px",
              cursor: "pointer",
            }}
          >
            <option value="fastest">Fastest</option>
            <option value="safest">Safest First</option>
          </select>
        </div>
      </div>

      {/* Current Context */}
      <div
        style={{
          padding: "12px 15px",
          backgroundColor:
            timeContext === "day" ? "#fefce8" : "#eef2ff",
          borderRadius: "8px",
          marginBottom: "20px",
          fontSize: "14px",
        }}
      >
        Safety scores are currently calculated for{" "}
        <strong>
          {timeContext === "day" ? "Day Travel" : "Night Travel"}
        </strong>
        .
      </div>

      {/* Route Cards */}
      {sortedRoutes.map((route) => {
        const safetyLevel = getSafetyLevel(route.safetyScore);
        const isExpanded = expandedRoute === route.id;

        return (
          <div
            key={route.id}
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "22px",
              marginBottom: "20px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
            }}
          >
            {/* Route Name and Badge */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "15px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                }}
              >
                {route.name}
              </h2>

              <span
                style={{
                  ...getBadgeStyle(safetyLevel),
                  padding: "7px 14px",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: "bold",
                  whiteSpace: "nowrap",
                }}
              >
                {safetyLevel === "UNKNOWN"
                  ? "SAFETY UNKNOWN"
                  : `${safetyLevel} SAFETY`}
              </span>
            </div>

            {/* Route Information */}
            <h3
              style={{
                marginTop: "18px",
                marginBottom: "8px",
              }}
            >
              {route.from} → {route.to}
            </h3>

            <p
              style={{
                color: "#555",
                marginTop: 0,
              }}
            >
              {route.travelTime} min • {route.distance} km
            </p>

            {/* Safety Score */}
            <div
              style={{
                marginTop: "18px",
                padding: "14px",
                backgroundColor: "#f8fafc",
                borderRadius: "8px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontWeight: "500",
                }}
              >
                Safety Score
              </span>

              <strong
                style={{
                  fontSize: "20px",
                }}
              >
                {route.safetyScore === null
                  ? "Data unavailable"
                  : `${route.safetyScore}/100`}
              </strong>
            </div>

            {/* Details Button */}
            <button
              type="button"
              onClick={() => toggleDetails(route.id)}
              style={{
                marginTop: "15px",
                padding: "10px 16px",
                borderRadius: "8px",
                border: "1px solid #2563eb",
                backgroundColor: "#ffffff",
                color: "#2563eb",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              {isExpanded
                ? "Hide Safety Details"
                : "View Safety Details"}
            </button>

            {/* Safety Breakdown */}
            {isExpanded && (
              <div
                style={{
                  marginTop: "15px",
                  padding: "18px",
                  backgroundColor: "#f8fafc",
                  borderRadius: "8px",
                }}
              >
                <h3
                  style={{
                    marginTop: 0,
                    marginBottom: "15px",
                  }}
                >
                  Safety Score Breakdown
                </h3>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "10px",
                    gap: "15px",
                  }}
                >
                  <span>Crime Safety</span>

                  <strong>
                    {displayFactor(route.crimeSafety)}
                  </strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "10px",
                    gap: "15px",
                  }}
                >
                  <span>Street Lighting</span>

                  <strong>
                    {displayFactor(route.lighting)}
                  </strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "10px",
                    gap: "15px",
                  }}
                >
                  <span>Community Reports</span>

                  <strong>
                    {displayFactor(route.communityReports)}
                  </strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "15px",
                  }}
                >
                  <span>
                    Time of Day Safety (
                    {timeContext === "day" ? "Day" : "Night"})
                  </span>

                  <strong>
                    {displayFactor(route.timeOfDay)}
                  </strong>
                </div>

                <p
                  style={{
                    marginBottom: 0,
                    marginTop: "16px",
                    paddingTop: "12px",
                    borderTop: "1px solid #e5e7eb",
                    color: "#666",
                    fontSize: "13px",
                  }}
                >
                  The safety score considers crime safety, street
                  lighting, community reports, and time-of-day
                  conditions.
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default RouteSafety;