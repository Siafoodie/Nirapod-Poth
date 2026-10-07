import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

export default function NearbyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [location, setLocation] = useState(null);
  const [votingId, setVotingId] = useState(null);

  // ==========================================
  // Get Logged-in User
  // ==========================================
  let storedUser = null;

  try {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      storedUser = JSON.parse(savedUser);
    }
  } catch (err) {
    console.error("Failed to read logged-in user:", err);
  }

  // Use unique user ID.
  // Fallback to email if backend user object has no _id/id.
  const voterId =
    storedUser?._id ||
    storedUser?.id ||
    storedUser?.email ||
    null;

  // ==========================================
  // Sort Reports by Credibility Score
  // Highest Score First
  // ==========================================
  const sortReportsByScore = (reportList) => {
    return [...reportList].sort((a, b) => {
      const scoreA =
        a.score ??
        (a.upvotes || 0) - (a.downvotes || 0);

      const scoreB =
        b.score ??
        (b.upvotes || 0) - (b.downvotes || 0);

      return scoreB - scoreA;
    });
  };

  // ==========================================
  // Load Nearby Reports
  // ==========================================
  const loadNearbyReports = () => {
    setError("");
    setLoading(true);

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
            : response.data || [];

          const sortedReports =
            sortReportsByScore(reportList);

          setReports(sortedReports);
        } catch (err) {
          setError(
            err.message ||
              "Unable to load nearby reports."
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
      }
    );
  };

  // ==========================================
  // Load Reports When Page Opens
  // ==========================================
  useEffect(() => {
    loadNearbyReports();
  }, []);

  // ==========================================
  // Vote
  // ==========================================
  const handleVote = async (reportId, vote) => {
    setError("");

    // ------------------------------------------
    // Login Check
    // ------------------------------------------
    if (!voterId) {
      setError(
        "Please sign in before voting."
      );
      return;
    }

    // ------------------------------------------
    // Offline Check
    // ------------------------------------------
    if (!navigator.onLine) {
      setError(
        "You are offline. Your vote was not submitted. Please reconnect and try again."
      );
      return;
    }

    // ------------------------------------------
    // Location Check
    // ------------------------------------------
    if (!location) {
      setError(
        "Your location is required before voting. Please refresh nearby reports."
      );
      return;
    }

    setVotingId(reportId);

    try {
      const response = await api(
        `/reports/${reportId}/vote`,
        {
          method: "POST",

          body: JSON.stringify({
            voterId,
            vote,
            latitude: location.latitude,
            longitude: location.longitude,
          }),
        }
      );

      const updatedReport = response.data;

      // ------------------------------------------
      // Update Vote + Ranking Immediately
      // ------------------------------------------
      setReports((currentReports) => {
        const updatedReports =
          currentReports.map((report) =>
            report._id === reportId
              ? {
                  ...report,

                  upvotes:
                    updatedReport.upvotes,

                  downvotes:
                    updatedReport.downvotes,

                  score:
                    updatedReport.score,

                  userVote:
                    updatedReport.userVote,
                }
              : report
          );

        return sortReportsByScore(
          updatedReports
        );
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
      {/* Back Button */}
      <Link to="/">
        ← Back to Home
      </Link>

      {/* Header */}
      <h1
        style={{
          marginTop: "25px",
        }}
      >
        Nearby Incident Reports
      </h1>

      <p
        style={{
          color: "#666",
        }}
      >
        View incidents reported near your current
        location and vote on their reliability.
      </p>

      {/* Login Information */}
      {!voterId && (
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

      {/* Location Information */}
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

      {/* Ranking Information */}
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

      {/* Refresh Button */}
      <button
        type="button"
        onClick={loadNearbyReports}
        disabled={loading}
        style={{
          padding: "10px 16px",
          marginBottom: "20px",

          cursor: loading
            ? "not-allowed"
            : "pointer",
        }}
      >
        {loading
          ? "Loading..."
          : "Refresh Nearby Reports"}
      </button>

      {/* Error Message */}
      {error && (
        <div
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

      {/* No Reports */}
      {!loading &&
        !error &&
        reports.length === 0 && (
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

      {/* Reports */}
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
          {/* Credibility Ranking */}
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

          {/* Incident Type */}
          <h2
            style={{
              marginTop: 0,
            }}
          >
            {report.incidentType}
          </h2>

          {/* Location */}
          <p>
            <strong>Location:</strong>{" "}
            {report.location}
          </p>

          {/* Description */}
          <p>
            {report.description}
          </p>

          {/* Voting Section */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              flexWrap: "wrap",
              marginTop: "18px",
            }}
          >
            {/* Upvote */}
            <button
              type="button"
              disabled={
                votingId === report._id
              }
              onClick={() =>
                handleVote(
                  report._id,
                  "upvote"
                )
              }
              style={{
                padding: "9px 14px",

                cursor:
                  votingId === report._id
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

            {/* Downvote */}
            <button
              type="button"
              disabled={
                votingId === report._id
              }
              onClick={() =>
                handleVote(
                  report._id,
                  "downvote"
                )
              }
              style={{
                padding: "9px 14px",

                cursor:
                  votingId === report._id
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

            {/* Score */}
            <strong>
              Score:{" "}
              {report.score ??
                (report.upvotes || 0) -
                  (report.downvotes || 0)}
            </strong>
          </div>

          {/* Current User Vote */}
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

          {/* Vote Loading */}
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