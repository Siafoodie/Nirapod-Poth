
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { getStoredUser } from "../utils/userStorage";

export default function NearbyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [location, setLocation] = useState(null);
  const [votingId, setVotingId] = useState(null);

  // Login information is only used for UI.
  // The backend verifies the actual user using JWT.
  const storedUser = getStoredUser();
  const token = localStorage.getItem("token");

  const isLoggedIn = Boolean(storedUser && token);

  // Sort reports by credibility score.
  const sortReportsByScore = (reportList) => {
    return [...reportList].sort((a, b) => {
      const scoreA =
        a.score ?? (a.upvotes || 0) - (a.downvotes || 0);

      const scoreB =
        b.score ?? (b.upvotes || 0) - (b.downvotes || 0);

      return scoreB - scoreA;
    });
  };

  // Load reports within 5 km.
  const loadNearbyReports = () => {
    setError("");
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
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        setLocation({
          latitude,
          longitude,
        });

        try {
          const response = await api(
            `/reports/nearby?latitude=${latitude}&longitude=${longitude}&radiusKm=5`
          );

          const reportList = Array.isArray(response)
            ? response
            : Array.isArray(response?.data)
              ? response.data
              : [];

          setReports(sortReportsByScore(reportList));
        } catch (err) {
          setError(
            err.message || "Unable to load nearby reports."
          );
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError(
          "Unable to access your location. Please allow location permission."
        );
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
      }
    );
  };

  // Load reports when page opens.
  useEffect(() => {
    loadNearbyReports();
  }, []);

  // Submit vote.
  const handleVote = async (reportId, vote) => {
    setError("");

    if (!isLoggedIn) {
      setError("Please sign in before voting.");
      return;
    }

    if (!navigator.onLine) {
      setError(
        "You are offline. Your vote was not submitted. Please reconnect and try again."
      );
      return;
    }

    if (!location) {
      setError(
        "Your location is required before voting. Please refresh nearby reports."
      );
      return;
    }

    if (votingId !== null) return;

    setVotingId(reportId);

    try {
      const response = await api(
        `/reports/${reportId}/vote`,
        {
          method: "POST",
          body: JSON.stringify({
            vote,
            latitude: location.latitude,
            longitude: location.longitude,
          }),
        }
      );

      const updatedReport = response?.data;

      if (!updatedReport) {
        throw new Error("Invalid vote response from server.");
      }

      setReports((currentReports) => {
        const updatedReports = currentReports.map(
          (report) =>
            report._id === reportId
              ? {
                  ...report,
                  upvotes: updatedReport.upvotes,
                  downvotes: updatedReport.downvotes,
                  score: updatedReport.score,
                  userVote: updatedReport.userVote,
                }
              : report
        );

        return sortReportsByScore(updatedReports);
      });
    } catch (err) {
      setError(
        err.message ||
          "Unable to submit your vote. Please check your connection."
      );
    } finally {
      setVotingId(null);
    }
  };

  return (
    <main
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "30px 20px",
      }}
    >
      {/* BACK BUTTON */}
      <Link to="/">← Back to Home</Link>

      {/* HEADER */}
      <h1 style={{ marginTop: "25px" }}>
        Nearby Incident Reports
      </h1>

      <p style={{ color: "#666" }}>
        View incidents reported near your current
        location and vote on their reliability.
      </p>

      {/* LOGIN INFORMATION */}
      {!isLoggedIn && (
        <div
          style={{
            background: "#fff7ed",
            color: "#9a3412",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "15px",
          }}
        >
          Please sign in to vote on incident reports.
        </div>
      )}

      {/* LOCATION INFORMATION */}
      {location && (
        <p
          style={{
            fontSize: "14px",
            color: "#666",
          }}
        >
          Showing reports within 5 km of your current
          location.
        </p>
      )}

      {/* RANKING INFORMATION */}
      {reports.length > 0 && (
        <p
          style={{
            fontSize: "14px",
            color: "#555",
            fontWeight: "bold",
          }}
        >
          Ranked by community credibility score —
          highest first.
        </p>
      )}

      {/* REFRESH BUTTON */}
      <button
        type="button"
        onClick={loadNearbyReports}
        disabled={loading}
        style={{
          padding: "10px 16px",
          marginBottom: "20px",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Loading..." : "Refresh Nearby Reports"}
      </button>

      {/* ERROR MESSAGE */}
      {error && (
        <div
          role="alert"
          style={{
            background: "#fee2e2",
            color: "#991b1b",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          {error}
        </div>
      )}

      {/* NO REPORTS */}
      {!loading && !error && reports.length === 0 && (
        <div
          style={{
            padding: "20px",
            background: "#f8fafc",
            borderRadius: "10px",
          }}
        >
          No nearby incident reports found.
        </div>
      )}

      {/* REPORT LIST */}
      {reports.map((report, index) => (
        <article
          key={report._id}
          style={{
            border: "1px solid #ddd",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "18px",
            background: "#fff",
          }}
        >
          {/* CREDIBILITY RANK */}
          <p
            style={{
              marginTop: 0,
              marginBottom: "8px",
              fontSize: "13px",
              color: "#666",
            }}
          >
            Credibility Rank #{index + 1}
          </p>

          {/* INCIDENT TYPE */}
          <h2 style={{ marginTop: 0 }}>
            {report.incidentType}
          </h2>

          {/* LOCATION */}
          <p>
            <strong>Location:</strong>{" "}
            {report.location}
          </p>

          {/* DESCRIPTION */}
          <p>{report.description}</p>

          {/* VOTING SECTION */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              flexWrap: "wrap",
              marginTop: "18px",
            }}
          >
            {/* UPVOTE */}
            <button
              type="button"
              disabled={votingId !== null || !isLoggedIn}
              onClick={() =>
                handleVote(report._id, "upvote")
              }
              style={{
                padding: "9px 14px",
                cursor:
                  votingId !== null || !isLoggedIn
                    ? "not-allowed"
                    : "pointer",
                fontWeight:
                  report.userVote === "upvote"
                    ? "bold"
                    : "normal",
                backgroundColor:
                  report.userVote === "upvote"
                    ? "#dcfce7"
                    : "#ffffff",
                border:
                  report.userVote === "upvote"
                    ? "2px solid #16a34a"
                    : "1px solid #aaa",
                borderRadius: "6px",
              }}
            >
              👍 Upvote ({report.upvotes || 0})
            </button>

            {/* DOWNVOTE */}
            <button
              type="button"
              disabled={votingId !== null || !isLoggedIn}
              onClick={() =>
                handleVote(report._id, "downvote")
              }
              style={{
                padding: "9px 14px",
                cursor:
                  votingId !== null || !isLoggedIn
                    ? "not-allowed"
                    : "pointer",
                fontWeight:
                  report.userVote === "downvote"
                    ? "bold"
                    : "normal",
                backgroundColor:
                  report.userVote === "downvote"
                    ? "#fee2e2"
                    : "#ffffff",
                border:
                  report.userVote === "downvote"
                    ? "2px solid #dc2626"
                    : "1px solid #aaa",
                borderRadius: "6px",
              }}
            >
              👎 Downvote ({report.downvotes || 0})
            </button>

            {/* SCORE */}
            <strong>
              Score:{" "}
              {report.score ??
                (report.upvotes || 0) -
                  (report.downvotes || 0)}
            </strong>
          </div>

          {/* CURRENT USER VOTE */}
          {report.userVote && (
            <p
              style={{
                marginBottom: 0,
                fontSize: "14px",
                color: "#555",
              }}
            >
              Your vote:{" "}
              <strong>
                {report.userVote === "upvote"
                  ? "Upvote"
                  : "Downvote"}
              </strong>
            </p>
          )}

          {/* VOTE LOADING */}
          {votingId === report._id && (
            <p
              style={{
                fontSize: "13px",
                color: "#666",
                marginBottom: 0,
              }}
            >
              Submitting vote...
            </p>
          )}
        </article>
      ))}
    </main>
  );
}
