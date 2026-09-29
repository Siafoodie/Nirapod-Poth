import React, { useState } from "react";
import useGeolocation from "../hooks/useGeolocation";
import { api } from "../api";

const ReportForm = () => {
  // =====ORIGINAL STATE =====
  const [formData, setFormData] = useState({
    incidentType: "",
    location: "",
    description: "",
  });

  // ===== NEW STATES (FOR API & LOADING) =====
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // ===== GEOLOCATION HOOK =====
  const { getCurrentPosition, error: geoError } = useGeolocation();

  // ===== ORIGINAL HANDLE CHANGE =====
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ===== HELPER: AUTO GET GPS LOCATION FOR INPUT =====
  const handleGetLocation = async () => {
    try {
      const coords = await getCurrentPosition();
      setFormData((prev) => ({
        ...prev,
        location: `GPS: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
      }));
    } catch (err) {
      console.error(err);
    }
  };

  // ===== UPDATED HANDLE SUBMIT WITH BACKEND API =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMessage("");

    try {
      // 1. Fetch real GPS coordinates if needed
      let coords = null;
      try {
        coords = await getCurrentPosition();
      } catch (err) {
        console.warn("GPS fetch optional:", err);
      }

      // 2. Submit form data to Backend API
      await api("/reports", {
        method: "POST",
        body: JSON.stringify({
          incidentType: formData.incidentType,
          location: formData.location,
          description: formData.description,
          latitude: coords?.lat || null,
          longitude: coords?.lng || null,
        }),
      });

      setStatusMessage("✅ Report submitted successfully!");
      setFormData({
        incidentType: "",
        location: "",
        description: "",
      });
    } catch (err) {
      setStatusMessage(`❌ ${err.message || "Failed to submit report"}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="report-form-container">
      <h2>Report an Incident</h2>
      <p>Please provide the details of the incident.</p>

      {/* STATUS & ERROR MESSAGES */}
      {statusMessage && (
        <p style={{ margin: "10px 0", fontWeight: "bold", color: statusMessage.includes("✅") ? "green" : "red" }}>
          {statusMessage}
        </p>
      )}

      {geoError && (
        <p style={{ fontSize: "12px", color: "red", marginBottom: "8px" }}>{geoError}</p>
      )}

      <form onSubmit={handleSubmit} className="report-form">

        {/* INCIDENT TYPE */}
        <div className="form-group">
          <label htmlFor="incidentType">Incident Type</label>

          <select
            id="incidentType"
            name="incidentType"
            value={formData.incidentType}
            onChange={handleChange}
            required
          >
            <option value="">Select incident type</option>
            <option value="harassment">Harassment</option>
            <option value="stalking">Stalking</option>
            <option value="theft">Theft</option>
            <option value="unsafe-area">Unsafe Area</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* LOCATION WITH GPS BUTTON */}
        <div className="form-group">
          <label htmlFor="location">Location</label>

          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              id="location"
              name="location"
              placeholder="Enter incident location"
              value={formData.location}
              onChange={handleChange}
              required
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={handleGetLocation}
              style={{ padding: "0 10px", cursor: "pointer", borderRadius: "4px" }}
              title="Get current GPS location"
            >
              📍 GPS
            </button>
          </div>
        </div>

        {/* DESCRIPTION */}
        <div className="form-group">
          <label htmlFor="description">Description</label>

          <textarea
            id="description"
            name="description"
            placeholder="Describe what happened..."
            rows="5"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>

        {/* SUBMIT BUTTON */}
        <button type="submit" className="report-submit-btn" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Report"}
        </button>

      </form>
    </div>
  );
};

export default ReportForm; 