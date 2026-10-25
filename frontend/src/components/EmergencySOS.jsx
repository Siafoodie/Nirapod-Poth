
import React, { useState } from "react";
import Layout from "../components/Layout";
import { enqueueOfflineItem } from "../services/offlineQueue";
import { useLanguage } from "../context/LanguageContext";
import useLiveShare from "../hooks/useLiveShare";

export default function EmergencySOS() {
  const { t } = useLanguage();

  const {
    session,
    sharing,
    error: liveError,
    start,
    stop,
  } = useLiveShare();

  const [sosStatus, setSosStatus] = useState("");

  // US-14: Save SOS event locally before opening SMS app
  const sendEmergencySMS = () => {
    const message =
      "EMERGENCY! I need help. Sent via Nirapod Poth.";

    try {
      const item = enqueueOfflineItem({
        type: "sos",
        payload: {
          message,
          triggeredAt: new Date().toISOString(),
        },
      });

      console.log("SOS event queued:", item.clientId);

      setSosStatus(
        "SOS event saved locally. It will sync when the app is online. Please complete sending the SMS in your messaging app."
      );
    } catch (error) {
      console.error("Failed to save SOS event:", error);

      setSosStatus(
        "Could not save the SOS event locally. Please contact emergency services directly."
      );
    }

    // Open SMS application on supported devices
    window.location.href =
      `sms:?body=${encodeURIComponent(message)}`;
  };

  const call999 = () => {
    window.location.href = "tel:999";
  };

  const call109 = () => {
    window.location.href = "tel:109";
  };

  const primaryButtonStyle = {
    width: "100%",
    background: "#6d28d9",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    padding: "16px 20px",
    fontWeight: 700,
    fontSize: "14px",
    cursor: "pointer",
    marginBottom: "8px",
  };

  const helplineButtonStyle = {
    width: "100%",
    background: "#f5f3ff",
    color: "#5b21b6",
    border: "none",
    borderRadius: "12px",
    padding: "14px 16px",
    fontWeight: 600,
    fontSize: "14px",
    cursor: "pointer",
    marginBottom: "10px",
  };

  return (
    <Layout title={t("emergency")} menu>
      <div
        style={{
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: "20px",
            padding: "32px 28px",
            width: "100%",
            maxWidth: "360px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
            textAlign: "center",
          }}
        >
          {/* Logo */}
          <div
            style={{
              width: "56px",
              height: "56px",
              margin: "0 auto 16px",
              borderRadius: "14px",
              background: "#1a1a2e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#a78bfa",
              fontWeight: 800,
              fontSize: "18px",
            }}
          >
            NP
          </div>

          {/* Title */}
          <h2
            style={{
              margin: "0 0 6px",
              fontSize: "22px",
              fontWeight: 700,
              color: "#1e1b4b",
            }}
          >
            {t("emergencySos") || "Emergency SOS"}
          </h2>

          {/* Subtitle */}
          <p
            style={{
              margin: "0 0 24px",
              fontSize: "13px",
              color: "#6b7280",
              lineHeight: 1.4,
            }}
          >
            {t("emergencySubtitle") ||
              "Quick response tools for urgent safety situations"}
          </p>

          {/* US-14: Emergency SMS */}
          <button
            type="button"
            onClick={sendEmergencySMS}
            style={primaryButtonStyle}
          >
            {t("sendEmergencySms") ||
              "SEND EMERGENCY SMS"}

            <div
              style={{
                fontSize: "11px",
                fontWeight: 400,
                opacity: 0.9,
                marginTop: "4px",
              }}
            >
              {t("worksOffline") ||
                "Works offline without internet/data"}
            </div>
          </button>

          {/* SOS Queue Status */}
          {sosStatus && (
            <div
              role="status"
              style={{
                marginTop: "12px",
                marginBottom: "14px",
                padding: "12px",
                background: "#f5f3ff",
                border: "1px solid #ddd6fe",
                borderRadius: "10px",
                color: "#5b21b6",
                fontSize: "12px",
                lineHeight: 1.5,
                textAlign: "left",
              }}
            >
              {sosStatus}
            </div>
          )}

          {/* National Helplines */}
          <div
            style={{
              margin: "22px 0 16px",
              fontSize: "11px",
              letterSpacing: "1px",
              color: "#9ca3af",
              fontWeight: 600,
            }}
          >
            {t("nationalHelplines") ||
              "NATIONAL HELPLINES"}
          </div>

          {/* 999 */}
          <button
            type="button"
            onClick={call999}
            style={helplineButtonStyle}
          >
            {t("callNationalEmergency") ||
              "Call National Emergency (999)"}
          </button>

          {/* 109 */}
          <button
            type="button"
            onClick={call109}
            style={helplineButtonStyle}
          >
            {t("callWomenHelpline") ||
              "Women & Children Helpline (109)"}
          </button>

          {/* US-15: Live Location Sharing */}
          <div
            style={{
              marginTop: 20,
              textAlign: "left",
            }}
          >
            <h3
              style={{
                margin: "0 0 8px",
                fontSize: 15,
                color: "#4a2c85",
              }}
            >
              Live location
            </h3>

            <p
              style={{
                margin: "0 0 12px",
                fontSize: 12,
                color: "#7e6c9c",
              }}
            >
              Share your live GPS with trusted contacts
              for up to 60 minutes.
            </p>

            {!sharing ? (
              <button
                type="button"
                onClick={() => start([])}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: 14,
                  border: "none",
                  background: "#693ed8",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                  boxShadow:
                    "0 6px 18px rgba(91, 43, 217, 0.22)",
                }}
              >
                Start live location
              </button>
            ) : (
              <div
                style={{
                  padding: 14,
                  borderRadius: 14,
                  background: "#f5f3ff",
                  border: "1px solid #e9e1f3",
                }}
              >
                <p
                  style={{
                    margin: "0 0 8px",
                    fontWeight: 700,
                    color: "#16a34a",
                  }}
                >
                  Live sharing ON
                </p>

                <p
                  style={{
                    margin: "0 0 6px",
                    fontSize: 12,
                  }}
                >
                  Share this link with trusted contacts:
                </p>

                <code
                  style={{
                    display: "block",
                    fontSize: 11,
                    wordBreak: "break-all",
                    marginBottom: 12,
                  }}
                >
                  {session?.shareToken
                    ? `${window.location.origin}/live/${session.shareToken}`
                    : ""}
                </code>

                <button
                  type="button"
                  onClick={stop}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: "1px solid #f9a8d4",
                    background: "#fdf2f8",
                    color: "#9d174d",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Stop sharing
                </button>
              </div>
            )}

            {liveError && (
              <p
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  color: "#b91c1c",
                }}
              >
                {liveError}
              </p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
