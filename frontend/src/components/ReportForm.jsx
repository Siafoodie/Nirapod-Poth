import React, { useState } from "react";
import useGeolocation from "../hooks/useGeolocation";
import { api } from "../api";

const initialForm = { incidentType: "", location: "", description: "" };

const ReportForm = () => {
  const [formData, setFormData] = useState(initialForm);
  const [incidentCoords, setIncidentCoords] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingGps, setLoadingGps] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const { getCurrentPosition, error: geoError } = useGeolocation();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Manually editing the location invalidates previously selected GPS coordinates.
    if (name === "location") setIncidentCoords(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStatusMessage("❌ Please select an image file.");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage("❌ Image size must be 5MB or less.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.onerror = () => setStatusMessage("❌ Could not read the image.");
    reader.readAsDataURL(file);
  };

  const handleGetLocation = async () => {
    setLoadingGps(true);
    setStatusMessage("");
    setIncidentCoords(null);
    try {
      const coords = await getCurrentPosition();
      const lat = Number(coords?.lat);
      const lng = Number(coords?.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) ||
          lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new Error("Invalid GPS coordinates");
      }
      setIncidentCoords({ lat, lng });
      setFormData((prev) => ({
        ...prev,
        location: `GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      }));
    } catch (err) {
      // An IP-based location is approximate and must not be sent as exact GPS.
      setIncidentCoords(null);
      setStatusMessage("❌ GPS unavailable. Please enter the incident location manually.");
    } finally {
      setLoadingGps(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting || loadingGps) return;
    setSubmitting(true);
    setStatusMessage("");
    try {
      // No identity fields and no automatic geolocation request on submit.
      const payload = {
        incidentType: formData.incidentType,
        location: formData.location.trim(),
        description: formData.description.trim(),
        latitude: incidentCoords?.lat ?? null,
        longitude: incidentCoords?.lng ?? null,
      };
      await api("/reports", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setStatusMessage("✅ Report submitted successfully!");
      setFormData(initialForm);
      setIncidentCoords(null);
      setImagePreview(null);
    } catch (err) {
      setStatusMessage(`❌ ${err.message || "Failed to submit report"}`);
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div style={styles.pageContainer}>
      <div style={styles.card}>
        <h2 style={styles.title}>Report an Incident</h2>
        <p style={styles.subtitle}>
          Please provide the details of the incident.
        </p>

        {statusMessage && (
          <div
            style={{
              ...styles.alertBox,
              backgroundColor: statusMessage.startsWith("✅")
                ? "#e8f5e9"
                : "#ffebee",
              color: statusMessage.startsWith("✅")
                ? "#2e7d32"
                : "#c62828",
            }}
          >
            {statusMessage}
          </div>
        )}

        {geoError && (
          <p style={styles.errorText}>{geoError}</p>
        )}

        <form onSubmit={handleSubmit}>
          {/* INCIDENT TYPE */}
          <div style={styles.fieldGroup}>
            <label htmlFor="incidentType" style={styles.label}>
              Incident Type
            </label>

            <select
              id="incidentType"
              name="incidentType"
              value={formData.incidentType}
              onChange={handleChange}
              required
              style={styles.selectInput}
            >
              <option value="">Select incident type</option>
              <option value="harassment">Harassment</option>
              <option value="stalking">Stalking</option>
              <option value="theft">Theft / Snatching</option>
              <option value="unsafe-area">Unsafe Area</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* LOCATION */}
          <div style={styles.fieldGroup}>
            <label htmlFor="location" style={styles.label}>
              Location
            </label>

            <div style={styles.locationContainer}>
              <input
                type="text"
                id="location"
                name="location"
                placeholder="Enter incident location"
                value={formData.location}
                onChange={handleChange}
                required
                style={styles.locationInput}
              />

              <button
                type="button"
                onClick={handleGetLocation}
                disabled={loadingGps || submitting}
                style={{
                  ...styles.gpsButton,
                  backgroundColor: loadingGps
                    ? "#e0d6f2"
                    : "#f2ebf9",
                }}
                title="Use current location as incident location"
              >
                {loadingGps ? "⌛ Fetching..." : "📍 GPS"}
              </button>
            </div>
          </div>

          {/* DESCRIPTION */}
          <div style={styles.fieldGroup}>
            <label htmlFor="description" style={styles.label}>
              Description (Optional)
            </label>

            <textarea
              id="description"
              name="description"
              placeholder="Describe what happened (optional)..."
              rows="4"
              value={formData.description}
              onChange={handleChange}
              style={styles.textareaInput}
            />
          </div>

          {/* IMAGE PREVIEW */}
          <div style={styles.fieldGroup}>
            <label style={styles.label}>
              Attach Image (Preview Only)
            </label>

            {!imagePreview ? (
              <label style={styles.uploadBox}>
                <span style={{ fontSize: "20px" }}>📷</span>
                <span
                  style={{
                    fontSize: "13px",
                    color: "#6b46c1",
                  }}
                >
                  Click to select image
                </span>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                />
              </label>
            ) : (
              <div style={styles.previewContainer}>
                <img
                  src={imagePreview}
                  alt="Incident Preview"
                  style={styles.previewImage}
                />

                <button
                  type="button"
                  onClick={() => setImagePreview(null)}
                  style={styles.removeImageBtn}
                >
                  ✕
                </button>
              </div>
            )}

            <p style={styles.helperText}>
              Image attachment is not saved yet.
            </p>
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={submitting || loadingGps}
            style={styles.submitButton}
          >
            {submitting ? "Submitting..." : "Submit Report"}
          </button>
        </form>
      </div>
    </div>
  );
};

// STYLES
const styles = {
  pageContainer: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f7f4fb",
    padding: "20px",
    boxSizing: "border-box",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: "24px",
    padding: "32px 28px",
    maxWidth: "440px",
    width: "100%",
    boxShadow: "0 12px 32px rgba(107, 70, 193, 0.08)",
    border: "1px solid #efe8f8",
    boxSizing: "border-box",
  },

  title: {
    margin: "0 0 6px 0",
    color: "#2d1a47",
    fontSize: "22px",
    fontWeight: "700",
  },

  subtitle: {
    margin: "0 0 20px 0",
    color: "#7e6c9c",
    fontSize: "13px",
  },

  alertBox: {
    padding: "10px 14px",
    borderRadius: "12px",
    marginBottom: "16px",
    fontSize: "13px",
    fontWeight: "600",
  },

  errorText: {
    fontSize: "12px",
    color: "#d32f2f",
    marginBottom: "10px",
  },

  fieldGroup: {
    marginBottom: "16px",
    textAlign: "left",
  },

  label: {
    display: "block",
    marginBottom: "6px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#4a2c85",
  },

  selectInput: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #e5dcf2",
    backgroundColor: "#faf8fc",
    fontSize: "14px",
    color: "#2d1a47",
    outline: "none",
    boxSizing: "border-box",
  },

  locationContainer: {
    display: "flex",
    gap: "8px",
  },

  locationInput: {
    flex: 1,
    minWidth: 0,
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #e5dcf2",
    backgroundColor: "#faf8fc",
    fontSize: "14px",
    color: "#2d1a47",
    outline: "none",
    boxSizing: "border-box",
  },

  gpsButton: {
    padding: "0 14px",
    borderRadius: "12px",
    border: "1px solid #e5dcf2",
    color: "#5e35b1",
    fontWeight: "700",
    fontSize: "13px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  textareaInput: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #e5dcf2",
    backgroundColor: "#faf8fc",
    fontSize: "14px",
    color: "#2d1a47",
    outline: "none",
    resize: "none",
    boxSizing: "border-box",
  },

  uploadBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "14px",
    border: "2px dashed #d6c7ee",
    borderRadius: "14px",
    backgroundColor: "#faf8fc",
    cursor: "pointer",
  },

  previewContainer: {
    position: "relative",
    width: "100%",
    maxHeight: "160px",
    borderRadius: "14px",
    overflow: "hidden",
    border: "1px solid #e5dcf2",
  },

  previewImage: {
    width: "100%",
    height: "160px",
    objectFit: "cover",
  },

  removeImageBtn: {
    position: "absolute",
    top: "8px",
    right: "8px",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    color: "#ffffff",
    border: "none",
    borderRadius: "50%",
    width: "26px",
    height: "26px",
    cursor: "pointer",
    fontSize: "12px",
  },

  helperText: {
    marginTop: "6px",
    color: "#7e6c9c",
    fontSize: "11px",
  },

  submitButton: {
    width: "100%",
    backgroundColor: "#5e35b1",
    color: "#ffffff",
    padding: "14px",
    fontSize: "15px",
    fontWeight: "700",
    border: "none",
    borderRadius: "14px",
    cursor: "pointer",
    marginTop: "10px",
    boxShadow: "0 6px 18px rgba(94, 53, 177, 0.2)",
  },
};

export default ReportForm;