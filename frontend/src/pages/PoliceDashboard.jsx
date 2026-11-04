
import { useEffect, useState } from "react";

const API_BASE = "http://localhost:5000/api/police";

export default function PoliceDashboard() {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);

  const [investigationStatus, setInvestigationStatus] =
    useState("investigating");
  const [investigationNote, setInvestigationNote] = useState("");

  const [riskLevel, setRiskLevel] = useState("medium");
  const [riskReason, setRiskReason] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const getToken = () => localStorage.getItem("token");

  const request = async (path, options = {}) => {
    const token = getToken();

    if (!token) {
      throw new Error("Login token missing. Please log in again.");
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    const raw = await response.text();
    let result;

    try {
      result = raw ? JSON.parse(raw) : {};
    } catch {
      throw new Error(
        `HTTP ${response.status}: Invalid server response`
      );
    }

    if (!response.ok || result.success === false) {
      throw new Error(
        `HTTP ${response.status}: ${
          result.message || "Request failed"
        }`
      );
    }

    return result;
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await request("/reports");

      const fetchedReports = Array.isArray(result.data)
        ? result.data
        : [];

      setReports(fetchedReports);

      setSelectedReport((current) => {
        if (!current) return null;

        return (
          fetchedReports.find(
            (report) => report._id === current._id
          ) || null
        );
      });

      console.log("Police reports loaded:", fetchedReports);
    } catch (err) {
      console.error("Load reports failed:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const selectReport = (report) => {
    console.log("Selected report:", report);

    setSelectedReport(report);

    setInvestigationStatus(
      report.investigationStatus === "completed"
        ? "completed"
        : "investigating"
    );

    setInvestigationNote(report.investigationNote || "");

    setRiskLevel(
      ["low", "medium", "high"].includes(report.policeRiskLevel)
        ? report.policeRiskLevel
        : "medium"
    );

    setRiskReason(report.policeRiskReason || "");

    setError("");
    setMessage("");
  };

  const updateSelected = (updated) => {
    if (!updated?._id) {
      throw new Error("Server did not return an updated report.");
    }

    setSelectedReport(updated);

    setReports((previous) =>
      previous.map((report) =>
        report._id === updated._id ? updated : report
      )
    );
  };

  const performAction = async (path, body, successMessage) => {
    if (!selectedReport) {
      setError("Please select a report first.");
      return;
    }

    if (saving) return;

    try {
      setSaving(true);
      setError("");
      setMessage("");

      console.log("Police API request:", {
        reportId: selectedReport._id,
        action: path,
        body,
      });

      const result = await request(
        `/reports/${selectedReport._id}/${path}`,
        {
          method: "PATCH",
          body: JSON.stringify(body),
        }
      );

      console.log("Police API response:", result);

      updateSelected(result.data);
      setMessage(result.message || successMessage);

      return result;
    } catch (err) {
      console.error(`Police ${path} failed:`, err);
      setError(err.message);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const saveInvestigation = async () => {
    if (!investigationNote.trim()) {
      setError("Please write investigation findings.");
      return;
    }

    await performAction(
      "investigate",
      {
        investigationStatus,
        investigationNote: investigationNote.trim(),
      },
      "Investigation saved successfully."
    );
  };

  const verifyReport = async (outcome) => {
    console.log("Verification button clicked:", outcome);
    console.log("Selected report:", selectedReport);
    console.log(
      "Saved investigation status:",
      selectedReport?.investigationStatus
    );

    if (!selectedReport) {
      setError("Please select a report.");
      return;
    }

    if (selectedReport.investigationStatus !== "completed") {
      setError(
        "Investigation must be completed and saved before verification."
      );
      return;
    }

    if (
      ["verified", "unsubstantiated"].includes(
        selectedReport.verificationOutcome
      )
    ) {
      setError("This report already has a final decision.");
      return;
    }

    await performAction(
      "verify",
      { outcome },
      `Report marked as ${outcome}.`
    );
  };

  const saveRisk = async () => {
    if (!riskReason.trim()) {
      setError("Please provide a risk assessment reason.");
      return;
    }

    await performAction(
      "risk",
      {
        riskLevel,
        reason: riskReason.trim(),
      },
      "Risk assessment saved successfully."
    );
  };

  const isFinalized = Boolean(
    selectedReport &&
      ["verified", "unsubstantiated"].includes(
        selectedReport.verificationOutcome
      )
  );

  const investigationCompleted =
    selectedReport?.investigationStatus === "completed";

  const canVerify =
    !!selectedReport &&
    !saving &&
    !isFinalized &&
    investigationCompleted;

  const hasCoordinates =
    Array.isArray(selectedReport?.geo?.coordinates) &&
    selectedReport.geo.coordinates.length === 2 &&
    selectedReport.geo.coordinates.every(
      (value) => typeof value === "number" && Number.isFinite(value)
    );

  const canAssessRisk =
    selectedReport?.verificationOutcome === "verified" &&
    selectedReport?.policeVerified === true &&
    hasCoordinates;

  const cardStyle = {
    background: "#ffffff",
    border: "1px solid #e2ddec",
    borderRadius: 12,
    padding: 20,
    boxShadow: "0 3px 12px rgba(0,0,0,0.04)",
    minWidth: 0,
  };

  const buttonStyle = {
    padding: "11px 17px",
    border: "none",
    borderRadius: 8,
    background: "#6d42b5",
    color: "white",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
  };

  const inputStyle = {
    width: "100%",
    padding: 11,
    borderRadius: 8,
    border: "1px solid #ccc",
    marginTop: 8,
    marginBottom: 12,
    boxSizing: "border-box",
    fontSize: 14,
  };

  const disabledStyle = {
    opacity: 0.5,
    cursor: "not-allowed",
  };

  const statusColor = (status) => {
    if (status === "verified" || status === "low") {
      return "#16803c";
    }

    if (status === "high" || status === "unsubstantiated") {
      return "#b42318";
    }

    if (status === "medium" || status === "investigating") {
      return "#b76b0a";
    }

    return "#625b71";
  };

  return (
    <main
      style={{
        padding: "24px",
        minHeight: "100vh",
        background: "#f7f4fb",
        color: "#201637",
        boxSizing: "border-box",
      }}
    >
      <h1>Police Dashboard</h1>

      <p>
        Investigate incidents, verify reports and assess location
        risks.
      </p>

      {error && (
        <div
          role="alert"
          style={{
            background: "#fff0f0",
            color: "#b42318",
            padding: 14,
            borderRadius: 8,
            marginBottom: 16,
            border: "1px solid #f3c3c3",
            overflowWrap: "anywhere",
          }}
        >
          <strong>Error: </strong>
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          style={{
            background: "#e9f8ee",
            color: "#166534",
            padding: 14,
            borderRadius: 8,
            marginBottom: 16,
            border: "1px solid #b7e5c5",
          }}
        >
          {message}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
          gap: 16,
          margin: "24px 0",
        }}
      >
        {[
          {
            label: "Total Reports",
            count: reports.length,
          },
          {
            label: "Investigating",
            count: reports.filter(
              (r) => r.investigationStatus === "investigating"
            ).length,
          },
          {
            label: "Verified",
            count: reports.filter(
              (r) => r.policeVerified === true
            ).length,
          },
          {
            label: "High Risk",
            count: reports.filter(
              (r) => r.policeRiskLevel === "high"
            ).length,
          },
        ].map((item) => (
          <div key={item.label} style={cardStyle}>
            <h3>{item.label}</h3>
            <h2>{item.count}</h2>
          </div>
        ))}
      </div>

      <p style={{ color: "#625b71", fontSize: 13 }}>
        Dashboard counts are based on the reports returned by the
        current API request.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
          gap: 20,
          alignItems: "start",
        }}
      >
        {/* INCIDENT REPORT LIST */}
        <section style={cardStyle}>
          <h2>Incident Reports</h2>

          <button
            type="button"
            style={buttonStyle}
            onClick={loadReports}
            disabled={loading || saving}
          >
            {loading ? "Loading..." : "Refresh Reports"}
          </button>

          {loading ? (
            <p>Loading reports...</p>
          ) : reports.length === 0 ? (
            <p>No approved incident reports available.</p>
          ) : (
            <div style={{ marginTop: 18 }}>
              {reports.map((report) => (
                <div
                  key={report._id}
                  style={{
                    border: "1px solid #ddd",
                    padding: 15,
                    marginBottom: 12,
                    borderRadius: 10,
                    background:
                      selectedReport?._id === report._id
                        ? "#f0e8ff"
                        : "#fff",
                  }}
                >
                  <h3>{report.incidentType}</h3>

                  <p>
                    <strong>Location:</strong> {report.location}
                  </p>

                  <p>
                    <strong>Investigation:</strong>{" "}
                    {report.investigationStatus || "not_started"}
                  </p>

                  <p>
                    <strong>Verification:</strong>{" "}
                    <span
                      style={{
                        color: statusColor(
                          report.verificationOutcome
                        ),
                        fontWeight: 600,
                      }}
                    >
                      {report.verificationOutcome || "unreviewed"}
                    </span>
                  </p>

                  <p>
                    <strong>Risk:</strong>{" "}
                    <span
                      style={{
                        color: statusColor(report.policeRiskLevel),
                        fontWeight: 600,
                      }}
                    >
                      {report.policeRiskLevel || "unassessed"}
                    </span>
                  </p>

                  <button
                    type="button"
                    style={buttonStyle}
                    onClick={() => selectReport(report)}
                  >
                    View / Investigate
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* INVESTIGATION DETAILS */}
        <section style={cardStyle}>
          <h2>Investigation Details</h2>

          {!selectedReport ? (
            <p>Select a report to start investigating.</p>
          ) : (
            <>
              <h3>{selectedReport.incidentType}</h3>

              <p>
                <strong>Location:</strong>{" "}
                {selectedReport.location}
              </p>

              <p>
                <strong>Description:</strong>{" "}
                {selectedReport.description || "No description"}
              </p>

              <p>
                <strong>Investigation Status:</strong>{" "}
                {selectedReport.investigationStatus ||
                  "not_started"}
              </p>

              <p>
                <strong>Verification:</strong>{" "}
                {selectedReport.verificationOutcome || "unreviewed"}
              </p>

              <p>
                <strong>Coordinates:</strong>{" "}
                {hasCoordinates
                  ? selectedReport.geo.coordinates.join(", ")
                  : "Not available"}
              </p>

              <hr
                style={{
                  border: 0,
                  borderTop: "1px solid #e5e0eb",
                  margin: "22px 0",
                }}
              />

              <h3>Investigation</h3>

              <label htmlFor="investigation-status">
                Investigation Status
              </label>

              <select
                id="investigation-status"
                style={inputStyle}
                value={investigationStatus}
                disabled={saving || isFinalized}
                onChange={(event) =>
                  setInvestigationStatus(event.target.value)
                }
              >
                <option value="investigating">
                  Investigating
                </option>
                <option value="completed">
                  Completed
                </option>
              </select>

              <label htmlFor="investigation-note">
                Investigation Findings
              </label>

              <textarea
                id="investigation-note"
                style={inputStyle}
                rows={5}
                maxLength={2000}
                value={investigationNote}
                disabled={saving || isFinalized}
                onChange={(event) =>
                  setInvestigationNote(event.target.value)
                }
                placeholder="Write investigation findings..."
              />

              <button
                type="button"
                style={{
                  ...buttonStyle,
                  ...(saving ||
                  isFinalized ||
                  !investigationNote.trim()
                    ? disabledStyle
                    : {}),
                }}
                disabled={
                  saving ||
                  isFinalized ||
                  !investigationNote.trim()
                }
                onClick={saveInvestigation}
              >
                {saving ? "Processing..." : "Save Investigation"}
              </button>

              {isFinalized && (
                <p style={{ color: "#625b71", fontSize: 13 }}>
                  This investigation has a final verification
                  decision and can no longer be edited.
                </p>
              )}

              <h3 style={{ marginTop: 26 }}>
                Verification Decision
              </h3>

              <p>
                Complete and save the investigation before
                verification.
              </p>

              <p
                style={{
                  color: investigationCompleted
                    ? "#16803c"
                    : "#b76b0a",
                  fontWeight: 600,
                }}
              >
                {investigationCompleted
                  ? "Investigation completed and saved."
                  : "Investigation not yet completed in the database."}
              </p>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                }}
              >
                <button
                  type="button"
                  style={{
                    ...buttonStyle,
                    ...(saving || isFinalized
                      ? disabledStyle
                      : {}),
                  }}
                  disabled={saving || isFinalized}
                  onClick={() => {
                    console.log("Verify button clicked");
                    console.log(
                      "Selected Report:",
                      selectedReport
                    );
                    console.log(
                      "Investigation Status:",
                      selectedReport?.investigationStatus
                    );

                    verifyReport("verified");
                  }}
                >
                  Verify Report
                </button>

                <button
                  type="button"
                  style={{
                    ...buttonStyle,
                    background: "#9c4052",
                    ...(saving || isFinalized
                      ? disabledStyle
                      : {}),
                  }}
                  disabled={saving || isFinalized}
                  onClick={() => {
                    console.log(
                      "Unsubstantiated button clicked"
                    );
                    verifyReport("unsubstantiated");
                  }}
                >
                  Mark Unsubstantiated
                </button>
              </div>

              {isFinalized && (
                <p style={{ color: "#16803c", fontWeight: 600 }}>
                  Final decision:{" "}
                  {selectedReport.verificationOutcome}
                </p>
              )}

              <h3 style={{ marginTop: 28 }}>
                Location Risk Assessment
              </h3>

              {!canAssessRisk && (
                <p style={{ color: "#9c4052", fontSize: 13 }}>
                  Risk assessment requires a verified report with
                  valid map coordinates.
                </p>
              )}

              <label htmlFor="risk-level">
                Risk Level
              </label>

              <select
                id="risk-level"
                style={inputStyle}
                value={riskLevel}
                disabled={saving || !canAssessRisk}
                onChange={(event) =>
                  setRiskLevel(event.target.value)
                }
              >
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
              </select>

              <label htmlFor="risk-reason">
                Risk Assessment Reason
              </label>

              <textarea
                id="risk-reason"
                style={inputStyle}
                rows={3}
                maxLength={1000}
                value={riskReason}
                disabled={saving || !canAssessRisk}
                onChange={(event) =>
                  setRiskReason(event.target.value)
                }
                placeholder="Explain the risk assessment..."
              />

              <button
                type="button"
                style={{
                  ...buttonStyle,
                  ...(saving ||
                  !canAssessRisk ||
                  !riskReason.trim()
                    ? disabledStyle
                    : {}),
                }}
                disabled={
                  saving ||
                  !canAssessRisk ||
                  !riskReason.trim()
                }
                onClick={saveRisk}
              >
                {saving
                  ? "Processing..."
                  : "Save Risk Assessment"}
              </button>

              {canAssessRisk && (
                <p style={{ color: "#16803c", fontSize: 13 }}>
                  This report is verified and has map coordinates.
                  Risk assessment is available.
                </p>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
