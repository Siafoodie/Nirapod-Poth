
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
)
  .replace(/\/+$/, "")
  .replace(/\/api$/, "");

const styles = {
  page: {
    maxWidth: 1100,
    margin: "30px auto",
    padding: 20,
    fontFamily: "Arial, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
  },
  filters: {
    display: "flex",
    gap: 10,
    margin: "25px 0",
    flexWrap: "wrap",
  },
  card: {
    border: "1px solid #ddd",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    background: "#fff",
  },
  button: {
    padding: "10px 18px",
    border: "none",
    borderRadius: 7,
    cursor: "pointer",
  },
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
        throw new Error(result.message || "Failed to load reports");
      }

      setAccessDenied(false);
      setReports(result.data || []);
    } catch (err) {
      setReports([]);
      setError(err.message);
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

      if (!response.ok) {
        throw new Error(result.message || "Moderation failed");
      }

      setMessage(`Report ${action} successfully.`);
      await loadReports();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  if (!token) {
    return (
      <main style={styles.page}>
        <h2>Admin Login Required</h2>
        <p>Please login before accessing this page.</p>
        <Link to="/login">Go to Login</Link>
      </main>
    );
  }

  if (accessDenied) {
    return (
      <main style={styles.page}>
        <h2>Access Denied</h2>
        <p>{error || "Only administrators can access this page."}</p>
        <Link to="/home">Back to Home</Link>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1>Admin Review Dashboard</h1>
          <p>Review and moderate incident reports.</p>
        </div>
        <Link to="/home">Back to Home</Link>
      </div>

      <div style={styles.filters}>
        {["pending", "approved", "rejected"].map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => {
              setFilter(status);
              setMessage("");
            }}
            style={{
              ...styles.button,
              background:
                filter === status ? "#2563eb" : "#e5e7eb",
              color: filter === status ? "#fff" : "#111",
              textTransform: "capitalize",
            }}
          >
            {status}
          </button>
        ))}
      </div>

      {message && (
        <p role="status" style={{ color: "green" }}>
          {message}
        </p>
      )}

      {error && (
        <p role="alert" style={{ color: "crimson" }}>
          {error}
        </p>
      )}

      {loading ? (
        <p>Loading reports...</p>
      ) : reports.length === 0 ? (
        <p>No {filter} reports found.</p>
      ) : (
        reports.map((report) => (
          <article key={report._id} style={styles.card}>
            <h3>{report.incidentType}</h3>

            <p>
              <strong>Location:</strong> {report.location}
            </p>

            <p>
              <strong>Description:</strong>{" "}
              {report.description || "No description provided"}
            </p>

            <p>
              <strong>Moderation Status:</strong>{" "}
              {report.moderationStatus || "pending"}
            </p>

            <p>
              <strong>Report Status:</strong> {report.status}
            </p>

            <p>
              <strong>Submitted:</strong>{" "}
              {report.createdAt
                ? new Date(report.createdAt).toLocaleString()
                : "Unknown"}
            </p>

            {Array.isArray(report.moderationHistory) &&
              report.moderationHistory.length > 0 && (
                <section>
                  <h4>Moderation Audit Trail</h4>

                  {report.moderationHistory.map((entry, index) => (
                    <div
                      key={index}
                      style={{
                        background: "#f3f4f6",
                        padding: 10,
                        marginBottom: 8,
                        borderRadius: 6,
                      }}
                    >
                      <p>
                        <strong>Action:</strong> {entry.action}
                      </p>
                      <p>
                        <strong>Admin ID:</strong>{" "}
                        {String(entry.adminId)}
                      </p>
                      <p>
                        <strong>Time:</strong>{" "}
                        {entry.timestamp
                          ? new Date(
                              entry.timestamp
                            ).toLocaleString()
                          : "Unknown"}
                      </p>
                      {entry.reason && (
                        <p>
                          <strong>Reason:</strong> {entry.reason}
                        </p>
                      )}
                    </div>
                  ))}
                </section>
              )}

            {(report.moderationStatus || "pending") ===
              "pending" && (
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  marginTop: 15,
                }}
              >
                <button
                  type="button"
                  disabled={busyId !== null}
                  onClick={() =>
                    moderateReport(report._id, "approved")
                  }
                  style={{
                    ...styles.button,
                    background: "#16a34a",
                    color: "#fff",
                  }}
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
                  style={{
                    ...styles.button,
                    background: "#dc2626",
                    color: "#fff",
                  }}
                >
                  {busyId === report._id
                    ? "Processing..."
                    : "Reject"}
                </button>
              </div>
            )}
          </article>
        ))
      )}
    </main>
  );
}
