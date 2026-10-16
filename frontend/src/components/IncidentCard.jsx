
import React, { useEffect, useState } from "react";
import { api } from "../api";

export function IncidentCard({ report }) {
  const getScore = (item) =>
    Number(
      item?.score ??
        (Number(item?.upvotes ?? 0) -
          Number(item?.downvotes ?? 0))
    );

  const normalizeVote = (value) => {
    if (value === "up" || value === "upvote" || value === 1) {
      return "up";
    }

    if (value === "down" || value === "downvote" || value === -1) {
      return "down";
    }

    return null;
  };

  const [votes, setVotes] = useState(getScore(report));

  const [userVote, setUserVote] = useState(
    normalizeVote(report?.userVote)
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setVotes(getScore(report));
    setUserVote(normalizeVote(report?.userVote));
    setError("");
  }, [report]);

  // Get user's real GPS location
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(
          new Error(
            "Your browser does not support GPS location."
          )
        );
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (geoError) => {
          if (geoError.code === 1) {
            reject(
              new Error(
                "Location permission denied. Please allow location access."
              )
            );
          } else if (geoError.code === 2) {
            reject(
              new Error(
                "Unable to detect your location. Please enable GPS."
              )
            );
          } else {
            reject(
              new Error(
                "Location request timed out. Please try again."
              )
            );
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 30000,
        }
      );
    });
  };

  // Submit upvote or downvote
  const submitVote = async (voteType) => {
    if (loading) return;

    if (!report?._id) {
      setError(
        "This report cannot be voted on because it has no ID."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Step 1: Get current GPS location
      const location = await getCurrentLocation();

      // Step 2: Send vote and location to backend
      const response = await api(
        `/reports/${report._id}/vote`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            vote: voteType,
            latitude: location.latitude,
            longitude: location.longitude,
          }),
        }
      );

      if (response?.success === false) {
        throw new Error(
          response.message || "Failed to submit vote"
        );
      }

      // Step 3: Read backend response
      const result = response?.data ?? response;

      // Step 4: Update score
      if (result?.score !== undefined) {
        setVotes(Number(result.score));
      } else if (
        result?.upvotes !== undefined &&
        result?.downvotes !== undefined
      ) {
        setVotes(
          Number(result.upvotes) -
            Number(result.downvotes)
        );
      }

      // Step 5: Update user's vote
      if (result?.userVote !== undefined) {
        setUserVote(normalizeVote(result.userVote));
      } else {
        setUserVote(
          voteType === "upvote" ? "up" : "down"
        );
      }
    } catch (err) {
      console.error("Incident vote error:", err);

      setError(
        err?.message || "Unable to submit your vote."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = () => submitVote("upvote");

  const handleDownvote = () => submitVote("downvote");

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "20px",
        boxShadow:
          "0 12px 30px rgba(124, 58, 237, 0.08)",
        border: "1px solid rgba(124, 58, 237, 0.12)",
        padding: "24px",
        maxWidth: "520px",
        margin: "20px auto",
        fontFamily: "Inter, system-ui, sans-serif",
        transition: "all 0.3s ease",
      }}
    >
      {/* Card Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #f3f0ff",
          paddingBottom: "14px",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "12px",
              background: "#f5f3ff",
              color: "#7c3aed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
            }}
          >
            🛡️
          </div>

          <h3
            style={{
              margin: 0,
              fontSize: "18px",
              color: "#2d1b4e",
              fontWeight: "700",
            }}
          >
            {report?.incidentType || "Incident Report"}
          </h3>
        </div>

        <span
          style={{
            fontSize: "12px",
            padding: "4px 12px",
            borderRadius: "20px",
            background: "#f3f4f6",
            color: "#4b5563",
            fontWeight: "500",
          }}
        >
          {report?.status || "Active"}
        </span>
      </div>

      {/* Description */}
      <p
        style={{
          color: "#4b5563",
          fontSize: "14px",
          lineHeight: "1.6",
          marginBottom: "24px",
          marginTop: 0,
        }}
      >
        {report?.description ||
          "No description available."}
      </p>

      {/* Error Message */}
      {error && (
        <p
          role="alert"
          style={{
            color: "#b42318",
            fontSize: "12px",
            marginBottom: "14px",
          }}
        >
          {error}
        </p>
      )}

      {/* Voting Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
          background: "#faf8ff",
          padding: "14px 20px",
          borderRadius: "14px",
          border: "1px solid #f0ebff",
        }}
      >
        {/* Upvote Button */}
        <button
          type="button"
          onClick={handleUpvote}
          disabled={loading}
          style={{
            background:
              userVote === "up"
                ? "#7c3aed"
                : "#ffffff",
            color:
              userVote === "up"
                ? "#ffffff"
                : "#7c3aed",
            border: "1px solid #7c3aed",
            padding: "8px 18px",
            borderRadius: "10px",
            cursor: loading ? "wait" : "pointer",
            fontWeight: "600",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            opacity: loading ? 0.6 : 1,
            boxShadow:
              userVote === "up"
                ? "0 4px 12px rgba(124, 58, 237, 0.3)"
                : "none",
            transition: "all 0.2s",
          }}
        >
          ↑ Upvote
        </button>

        {/* Score */}
        <div style={{ textAlign: "center" }}>
          <span
            style={{
              fontSize: "11px",
              color: "#8b5cf6",
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              display: "block",
              fontWeight: "700",
            }}
          >
            Score
          </span>

          <span
            style={{
              fontSize: "18px",
              fontWeight: "800",
              color: "#1f2937",
            }}
          >
            {votes}
          </span>
        </div>

        {/* Downvote Button */}
        <button
          type="button"
          onClick={handleDownvote}
          disabled={loading}
          style={{
            background:
              userVote === "down"
                ? "#6b7280"
                : "#ffffff",
            color:
              userVote === "down"
                ? "#ffffff"
                : "#4b5563",
            border: "1px solid #d1d5db",
            padding: "8px 18px",
            borderRadius: "10px",
            cursor: loading ? "wait" : "pointer",
            fontWeight: "600",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            opacity: loading ? 0.6 : 1,
            transition: "all 0.2s",
          }}
        >
          ↓ Downvote
        </button>
      </div>

      {/* User Vote Status */}
      {userVote && (
        <p
          style={{
            marginTop: "12px",
            marginBottom: 0,
            color: "#6b7280",
            fontSize: "12px",
          }}
        >
          Your vote:{" "}
          <strong>
            {userVote === "up"
              ? "Upvote"
              : "Downvote"}
          </strong>
        </p>
      )}
    </div>
  );
}

export default IncidentCard;
