
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./AdminDashboard.css";

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
)
  .replace(/\/+$/, "")
  .replace(/\/api$/, "");

const FILTERS = ["pending", "approved", "rejected"];

const formatDate = (value) => {
  if (!value) return "Unknown";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Unknown"
    : date.toLocaleString();
};

export default function AdminDashboard() {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);

  const token = localStorage.getItem("token");

  const loadReports = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setReports([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE}/api/moderation/reports?status=${filter}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (response.status === 401 || response.status === 403) {
        setAccessDenied(true);
        throw new Error(
          result.message || "You do not have admin access"
        );
      }

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to load reports"
        );
      }

      setAccessDenied(false);
      setReports(
        Array.isArray(result.data) ? result.data : []
      );
    } catch (err) {
      setReports([]);
      setError(err.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [filter, token]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const moderateReport = async (reportId, action) => {
    const confirmed = window.confirm(
      `Are you sure you want to ${action} this report?`
    );

    if (!confirmed) return;

    const reason = window.prompt(
      "Enter reason (optional, maximum 500 characters):",
      ""
    );

    if (reason === null) return;

    if (reason.length > 500) {
      setError("Reason must not exceed 500 characters");
      return;
    }

    setBusyId(reportId);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_BASE}/api/moderation/reports/${reportId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action,
            reason,
          }),
        }
      );

      const result = await response.json();

      if (response.status === 401 || response.status === 403) {
        setAccessDenied(true);
        throw new Error(
          result.message || "You do not have admin access"
        );
      }

      if (!response.ok) {
        throw new Error(
          result.message || "Moderation failed"
        );
      }

      setMessage(`Report ${action} successfully.`);
      await loadReports();
    } catch (err) {
      setError(err.message || "Moderation failed");
    } finally {
      setBusyId(null);
    }
  };

  if (!token) {
    return (
      <main className="np-admin-page">
        <h2>Admin Login Required</h2>
        <p>Please login before accessing this page.</p>
        <Link to="/login">Go to Login</Link>
      </main>
    );
  }

  if (accessDenied) {
    return (
      <main className="np-admin-page">
        <h2>Access Denied</h2>
        <p>
          {error || "Only administrators can access this page."}
        </p>
        <Link to="/home">Back to Home</Link>
      </main>
    );
  }

  return (
    <main className="np-admin-page">
      <div className="np-admin-header">
        <div>
          <h1>Admin Review Dashboard</h1>
          <p>Review and moderate incident reports.</p>
        </div>

        <Link to="/home" className="np-admin-back">
          Back to Home
        </Link>
      </div>

      <div className="np-admin-filters">
        {FILTERS.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => {
              setFilter(status);
              setMessage("");
            }}
            className={`np-admin-filter ${
              filter === status ? "active" : ""
            }`}
            aria-pressed={filter === status}
          >
            {status}
          </button>
        ))}
      </div>

      {message && (
        <p role="status" className="np-admin-success">
          {message}
        </p>
      )}

      {error && (
        <p role="alert" className="np-admin-error">
          {error}
        </p>
      )}

      {loading ? (
        <p>Loading reports...</p>
      ) : reports.length === 0 ? (
        <p>No {filter} reports found.</p>
      ) : (
        <div className="np-admin-reports">
          {reports.map((report) => (
            <article
              key={report._id}
              className="np-admin-card"
            >
              <h3>{report.incidentType}</h3>

              <p>
                <strong>Location:</strong>{" "}
                {report.location}
              </p>

              <p>
                <strong>Description:</strong>{" "}
                {report.description ||
                  "No description provided"}
              </p>

              <p>
                <strong>Moderation Status:</strong>{" "}
                {report.moderationStatus || "pending"}
              </p>

              <p>
                <strong>Report Status:</strong>{" "}
                {report.status}
              </p>

              <p>
                <strong>Submitted:</strong>{" "}
                {formatDate(report.createdAt)}
              </p>

              {Array.isArray(report.moderationHistory) &&
                report.moderationHistory.length > 0 && (
                  <section className="np-admin-history">
                    <h4>Moderation Audit Trail</h4>

                    {report.moderationHistory.map(
                      (entry, index) => (
                        <div
                          key={index}
                          className="np-admin-history-entry"
                        >
                          <p>
                            <strong>Action:</strong>{" "}
                            {entry.action}
                          </p>

                          <p>
                            <strong>Admin ID:</strong>{" "}
                            {String(entry.adminId)}
                          </p>

                          <p>
                            <strong>Time:</strong>{" "}
                            {formatDate(entry.timestamp)}
                          </p>

                          {entry.reason && (
                            <p>
                              <strong>Reason:</strong>{" "}
                              {entry.reason}
                            </p>
                          )}
                        </div>
                      )
                    )}
                  </section>
                )}

              {(report.moderationStatus || "pending") ===
                "pending" && (
                <div className="np-admin-actions">
                  <button
                    type="button"
                    disabled={busyId !== null}
                    onClick={() =>
                      moderateReport(report._id, "approved")
                    }
                    className="np-admin-action approve"
                  >
                    {busyId === report._id
                      ? "Processing..."
                      : "Approve"}
                  </button>

                  <button
                    type="button"
                    disabled={busyId !== null}
                    onClick={() =>
                      moderateReport(report._id, "rejected")
                    }
                    className="np-admin-action reject"
                  >
                    {busyId === report._id
                      ? "Processing..."
                      : "Reject"}
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
