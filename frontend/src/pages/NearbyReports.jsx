
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  LocateFixed,
  MapPin,
  RefreshCw,
  ShieldCheck,
  ThumbsDown,
  ThumbsUp,
  Users,
  WifiOff,
  Sparkles,
  Info,
  LoaderCircle,
} from "lucide-react";

import { api } from "../api";
import { getStoredUser } from "../utils/userStorage";
import "./NearbyReports.css";

const RADIUS_KM = 5;

// Calculate credibility score
const scoreOf = (report) => {
  return Number(
    report.score ??
      (Number(report.upvotes || 0) -
        Number(report.downvotes || 0))
  );
};

// Sort reports by credibility score
const sortReportsByScore = (items) => {
  return [...items].sort(
    (a, b) => scoreOf(b) - scoreOf(a)
  );
};

// Choose icon based on incident type
function getIncidentIcon(type) {
  const value = String(type || "").toLowerCase();

  if (
    value.includes("harass") ||
    value.includes("assault") ||
    value.includes("violence")
  ) {
    return <AlertTriangle size={23} />;
  }

  if (
    value.includes("safe") ||
    value.includes("help")
  ) {
    return <ShieldCheck size={23} />;
  }

  return <Info size={23} />;
}

// Handle different API response formats
function getReportsArray(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.reports)) {
    return response.reports;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.reports)) {
    return response.data.reports;
  }

  return null;
}

export default function NearbyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [location, setLocation] = useState(null);
  const [votingId, setVotingId] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  const requestRef = useRef(0);
  const mountedRef = useRef(false);
  const votingRef = useRef(false);

  const isLoggedIn = Boolean(
    authReady &&
      getStoredUser() &&
      localStorage.getItem("token")
  );

  // Fetch reports from backend
  const fetchReports = useCallback(
    async (latitude, longitude, requestId) => {
      const response = await api(
        `/reports/nearby?latitude=${encodeURIComponent(
          latitude
        )}&longitude=${encodeURIComponent(
          longitude
        )}&radiusKm=${RADIUS_KM}`
      );

      const list = getReportsArray(response);

      if (!list) {
        throw new Error(
          "Nearby reports API returned an unexpected response."
        );
      }

      if (
        mountedRef.current &&
        requestId === requestRef.current
      ) {
        setReports(sortReportsByScore(list));
      }
    },
    []
  );

  // Get GPS location and load reports
  const loadNearbyReports = useCallback(() => {
    const requestId = ++requestRef.current;

    setError("");
    setNotice("");
    setLoading(true);
    setLocation(null);
    setReports([]);

    if (!navigator.geolocation) {
      setError(
        "Geolocation is not supported by this browser."
      );
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (
          !mountedRef.current ||
          requestId !== requestRef.current
        ) {
          return;
        }

        const { latitude, longitude } =
          position.coords;

        setLocation({
          latitude,
          longitude,
        });

        try {
          await fetchReports(
            latitude,
            longitude,
            requestId
          );
        } catch (err) {
          if (
            mountedRef.current &&
            requestId === requestRef.current
          ) {
            setError(
              err.message ||
                "Unable to load nearby reports."
            );
          }
        } finally {
          if (
            mountedRef.current &&
            requestId === requestRef.current
          ) {
            setLoading(false);
          }
        }
      },

      (geoError) => {
        if (
          !mountedRef.current ||
          requestId !== requestRef.current
        ) {
          return;
        }

        setError(
          geoError.code === 1
            ? "Location permission denied. Please enable location access."
            : "Unable to access your location. Please try again."
        );

        setLoading(false);
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
      }
    );
  }, [fetchReports]);

  // Load reports when page opens
  useEffect(() => {
    mountedRef.current = true;
    setAuthReady(true);

    loadNearbyReports();

    return () => {
      mountedRef.current = false;
      requestRef.current += 1;
    };
  }, [loadNearbyReports]);

  // Submit upvote or downvote
  const handleVote = async (reportId, vote) => {
    setError("");
    setNotice("");

    if (!isLoggedIn) {
      setError("Please sign in before voting.");
      return;
    }

    if (!navigator.onLine) {
      setError(
        "You are offline. Please reconnect and try again."
      );
      return;
    }

    if (!location) {
      setError(
        "Your location is required before voting. Please refresh nearby reports."
      );
      return;
    }

    if (votingRef.current) {
      return;
    }

    votingRef.current = true;
    setVotingId(reportId);

    try {
      await api(`/reports/${reportId}/vote`, {
        method: "POST",
        body: JSON.stringify({
          vote,
          latitude: location.latitude,
          longitude: location.longitude,
        }),
      });

      // Reload from backend to get actual vote totals
      const requestId = requestRef.current;

      await fetchReports(
        location.latitude,
        location.longitude,
        requestId
      );

      setNotice(
        vote === "upvote"
          ? "Your upvote was submitted successfully."
          : "Your downvote was submitted successfully."
      );
    } catch (err) {
      setError(
        err.message ||
          "Unable to submit your vote."
      );
    } finally {
      votingRef.current = false;

      if (mountedRef.current) {
        setVotingId(null);
      }
    }
  };

  return (
    <main className="nr-page">
      <div className="nr-container">

        {/* Back to Home */}
        <Link to="/home" className="nr-back-link">
          <ArrowLeft size={18} />
          Back to Home
        </Link>

        {/* Hero Section */}
        <section className="nr-hero">
          <div className="nr-hero-content">
            <div className="nr-hero-label">
              <Sparkles size={17} />
              COMMUNITY SAFETY NETWORK
            </div>

            <h1>Nearby Incident Reports</h1>

            <p>
              Stay informed about incidents around
              your current location and help build
              a safer community through reliable
              reporting.
            </p>

            <div className="nr-hero-stats">
              <div className="nr-stat">
                <LocateFixed size={22} />

                <div>
                  <strong>{RADIUS_KM} km</strong>
                  <span>Search Radius</span>
                </div>
              </div>

              <div className="nr-stat">
                <Users size={22} />

                <div>
                  <strong>{reports.length}</strong>
                  <span>Nearby Reports</span>
                </div>
              </div>

              <div className="nr-stat">
                <ShieldCheck size={22} />

                <div>
                  <strong>Community</strong>
                  <span>Credibility Ranking</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section Header */}
        <section className="nr-section">
          <div className="nr-section-header">
            <div>
              <div className="nr-section-eyebrow">
                <MapPin size={16} />
                YOUR SURROUNDINGS
              </div>

              <h2>Community Reports</h2>

              <p>
                Reports are ranked by community
                credibility score, highest first.
              </p>
            </div>

            <button
              type="button"
              className="nr-refresh-btn"
              onClick={loadNearbyReports}
              disabled={loading || votingId !== null}
            >
              <RefreshCw
                size={17}
                className={
                  loading ? "nr-spinning" : ""
                }
              />
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="nr-alert nr-error"
              role="alert"
            >
              <AlertTriangle size={20} />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {notice && (
            <div
              className="nr-alert nr-success"
              role="status"
            >
              <CheckCircle2 size={20} />
              <span>{notice}</span>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="nr-state-card">
              <LoaderCircle
                size={35}
                className="nr-spinning"
              />

              <h3>Finding nearby reports...</h3>

              <p>
                Checking your location and
                loading community reports.
              </p>
            </div>
          )}

          {/* Empty State */}
          {!loading &&
            !error &&
            reports.length === 0 && (
              <div className="nr-state-card">
                <ShieldCheck size={42} />

                <h3>No nearby reports found</h3>

                <p>
                  There are currently no reported
                  incidents within {RADIUS_KM} km
                  of your location.
                </p>
              </div>
            )}

          {/* Reports List */}
          {!loading && reports.length > 0 && (
            <div className="nr-report-list">
              {reports.map((report, index) => {
                const reportId =
                  report._id || report.id;

                const upvotes = Number(
                  report.upvotes || 0
                );

                const downvotes = Number(
                  report.downvotes || 0
                );

                const score = scoreOf(report);

                const incidentType =
                  report.incidentType ||
                  report.type ||
                  "Incident Report";

                const reportLocation =
                  report.location || "Unknown location";

                const userVote =
                  report.userVote || null;

                const isVoting =
                  votingId === reportId;

                return (
                  <article
                    key={reportId || index}
                    className="nr-report-card"
                  >
                    {/* Card Header */}
                    <div className="nr-card-top">
                      <div className="nr-incident-icon">
                        {getIncidentIcon(
                          incidentType
                        )}
                      </div>

                      <div className="nr-rank-badge">
                        <ShieldCheck size={14} />
                        RANK #{index + 1}
                      </div>
                    </div>

                    {/* Incident Information */}
                    <h3>{incidentType}</h3>

                    <div className="nr-location">
                      <MapPin size={17} />
                      <span>{reportLocation}</span>
                    </div>

                    {report.description && (
                      <p className="nr-description">
                        {report.description}
                      </p>
                    )}

                    {/* Voting Section */}
                    <div className="nr-vote-section">
                      <div className="nr-vote-buttons">
                        <button
                          type="button"
                          className={`nr-vote-btn nr-upvote ${
                            userVote === "upvote"
                              ? "selected"
                              : ""
                          }`}
                          onClick={() =>
                            handleVote(
                              reportId,
                              "upvote"
                            )
                          }
                          disabled={
                            votingId !== null ||
                            !reportId
                          }
                          aria-pressed={
                            userVote === "upvote"
                          }
                        >
                          <ThumbsUp size={17} />

                          <span>
                            Upvote ({upvotes})
                          </span>
                        </button>

                        <button
                          type="button"
                          className={`nr-vote-btn nr-downvote ${
                            userVote === "downvote"
                              ? "selected"
                              : ""
                          }`}
                          onClick={() =>
                            handleVote(
                              reportId,
                              "downvote"
                            )
                          }
                          disabled={
                            votingId !== null ||
                            !reportId
                          }
                          aria-pressed={
                            userVote === "downvote"
                          }
                        >
                          <ThumbsDown size={17} />

                          <span>
                            Downvote ({downvotes})
                          </span>
                        </button>
                      </div>

                      <div className="nr-score">
                        <span>Credibility Score</span>
                        <strong>{score}</strong>
                      </div>
                    </div>

                    {isVoting && (
                      <div className="nr-voting-status">
                        <LoaderCircle
                          size={15}
                          className="nr-spinning"
                        />
                        Submitting your vote...
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          {/* Footer Information */}
          <div className="nr-info-footer">
            <Info size={18} />

            <p>
              Community votes indicate report
              credibility, not official verification.
              Please contact emergency services
              if you are in immediate danger.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
