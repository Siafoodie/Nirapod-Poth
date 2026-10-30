
import React, { useState } from "react";
import "./ReportForm.css";
import useGeolocation from "../hooks/useGeolocation";
import { api } from "../api";
import {
  enqueueOfflineItem,
  isOnline,
} from "../services/offlineQueue";

const initialForm = {
  incidentType: "",
  location: "",
  description: "",
};

export default function ReportForm() {
  const [formData, setFormData] = useState(initialForm);
  const [incidentCoords, setIncidentCoords] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingGps, setLoadingGps] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [imagePreview, setImagePreview] = useState(null);

  const {
    getCurrentPosition,
    error: geoError,
  } = useGeolocation();

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "location") {
      setIncidentCoords(null);
    }
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

    reader.onload = () => {
      setImagePreview(reader.result);
    };

    reader.onerror = () => {
      setStatusMessage("❌ Could not read the image.");
    };

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

      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {
        throw new Error("Invalid GPS coordinates");
      }

      setIncidentCoords({ lat, lng });

      setFormData((prev) => ({
        ...prev,
        location: `GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      }));
    } catch (err) {
      setIncidentCoords(null);
      setStatusMessage(
        "❌ GPS unavailable. Please enter the incident location manually."
      );
    } finally {
      setLoadingGps(false);
    }
  };

  const resetForm = () => {
    setFormData(initialForm);
    setIncidentCoords(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting || loadingGps) return;

    setSubmitting(true);
    setStatusMessage("");

    const payload = {
      incidentType: formData.incidentType,
      location: formData.location.trim(),
      description: formData.description.trim(),
      latitude: incidentCoords?.lat ?? null,
      longitude: incidentCoords?.lng ?? null,
    };

    try {
      if (!isOnline()) {
        enqueueOfflineItem({
          type: "report",
          payload,
        });

        setStatusMessage(
          "📡 You are offline. Report saved locally and will send when internet returns."
        );

        resetForm();
        return;
      }

      await api("/reports", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setStatusMessage("✅ Report submitted successfully!");
      resetForm();
    } catch (err) {
      try {
        enqueueOfflineItem({
          type: "report",
          payload,
        });

        setStatusMessage(
          `📡 ${err.message || "Failed to submit"} — saved offline for automatic retry.`
        );

        resetForm();
      } catch (queueError) {
        console.error("Offline queue failed:", queueError);

        setStatusMessage(
          "❌ Report could not be submitted or saved offline. Please try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="np-report-page">
      <div className="np-report-card">

        <h2 className="np-report-title">
          Report an Incident
        </h2>

        <p className="np-report-subtitle">
          Please provide the details of the incident.
        </p>

        {statusMessage && (
          <div
            role="status"
            className={`np-report-alert ${
              statusMessage.startsWith("✅")
                ? "success"
                : statusMessage.startsWith("📡")
                ? "offline"
                : "error"
            }`}
          >
            {statusMessage}
          </div>
        )}

        {geoError && (
          <p className="np-report-error">
            {geoError}
          </p>
        )}

        <form onSubmit={handleSubmit}>

          {/* INCIDENT TYPE */}
          <div className="np-report-field">
            <label htmlFor="incidentType">
              Incident Type
            </label>

            <select
              id="incidentType"
              name="incidentType"
              value={formData.incidentType}
              onChange={handleChange}
              required
            >
              <option value="">
                Select incident type
              </option>
              <option value="harassment">
                Harassment
              </option>
              <option value="stalking">
                Stalking
              </option>
              <option value="theft">
                Theft / Snatching
              </option>
              <option value="unsafe-area">
                Unsafe Area
              </option>
              <option value="other">
                Other
              </option>
            </select>
          </div>

          {/* LOCATION */}
          <div className="np-report-field">
            <label htmlFor="location">
              Location
            </label>

            <div className="np-report-location">
              <input
                type="text"
                id="location"
                name="location"
                placeholder="Enter incident location"
                value={formData.location}
                onChange={handleChange}
                required
              />

              <button
                type="button"
                className="np-report-gps"
                onClick={handleGetLocation}
                disabled={loadingGps || submitting}
                title="Use current location as incident location"
              >
                {loadingGps
                  ? "⌛ Fetching..."
                  : "📍 GPS"}
              </button>
            </div>

            <p className="np-report-helper">
              🔒 Anonymous Report: Your name, email,
              phone number, and travel history will not
              be attached to this report. GPS location
              is optional. If you use GPS, your
              coordinates will be included in the
              report. Please avoid including personal
              information in the description.
            </p>
          </div>

          {/* DESCRIPTION */}
          <div className="np-report-field">
            <label htmlFor="description">
              Description (Optional)
            </label>

            <textarea
              id="description"
              name="description"
              placeholder="Describe what happened (optional)..."
              rows={4}
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          {/* IMAGE PREVIEW */}
          <div className="np-report-field">
            <label>
              Attach Image (Preview Only)
            </label>

            {!imagePreview ? (
              <label className="np-report-upload">
                <span className="np-report-camera">
                  📷
                </span>

                <span>
                  Click to select image
                </span>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="np-report-file-input"
                />
              </label>
            ) : (
              <div className="np-report-preview">
                <img
                  src={imagePreview}
                  alt="Incident Preview"
                />

                <button
                  type="button"
                  className="np-report-remove"
                  onClick={() => setImagePreview(null)}
                  aria-label="Remove selected image"
                >
                  ✕
                </button>
              </div>
            )}

            <p className="np-report-helper">
              Image attachment is not saved yet.
            </p>
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            className="np-report-submit"
            disabled={submitting || loadingGps}
          >
            {submitting
              ? "Submitting..."
              : "Submit Report"}
          </button>

        </form>
      </div>
    </div>
  );
}
