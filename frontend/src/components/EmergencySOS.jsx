
import React, { useState } from "react";
import {
  Siren,
  Phone,
  MapPin,
  Share2,
  Square,
  Copy,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

import Layout from "../components/Layout";
import { enqueueOfflineItem } from "../services/offlineQueue";
import { useLanguage } from "../context/LanguageContext";
import useLiveShare from "../hooks/useLiveShare";
import "./EmergencySOS.css";

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
  const [sosError, setSosError] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = session?.shareUrl ||
    (session?.shareToken
      ? `${window.location.origin}/live/${session.shareToken}`
      : "");

  // US-14: Preserve offline SOS queue
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

      setSosError(false);
      setSosStatus(
        "SOS event saved locally for synchronization. Complete sending the SMS in your messaging app."
      );
    } catch (error) {
      console.error("Failed to queue SOS:", error);

      setSosError(true);
      setSosStatus(
        "SOS event could not be saved locally. You can still try sending the SMS or call emergency services."
      );
    }

    window.location.href =
      `sms:?body=${encodeURIComponent(message)}`;
  };

  const call999 = () => {
    window.location.href = "tel:999";
  };

  const call109 = () => {
    window.location.href = "tel:109";
  };

  // US-15: Preserve live location hook
  const startLiveSharing = async () => {
    setCopied(false);
    await start([]);
  };

  const stopLiveSharing = async () => {
    await stop();
    setCopied(false);
  };

  const copyShareLink = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const shareLiveLink = async () => {
    if (!shareUrl) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Nirapod Poth Live Location",
          text: "Follow my live location:",
          url: shareUrl,
        });
      } else {
        await copyShareLink();
      }
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.error("Unable to share link:", error);
      }
    }
  };

  return (
    <Layout title={t("emergency")} menu>
      <main className="np-sos-page">
        <div className="np-sos-container">

          <div className="np-sos-heading">
            <div className="np-sos-heading-icon">
              <Siren size={24} />
            </div>

            <div>
              <h1>
                {t("emergencySos") || "Emergency SOS"}
              </h1>
              <p>
                {t("emergencySubtitle") ||
                  "Quick response tools for urgent safety situations"}
              </p>
            </div>
          </div>

          <section className="np-sos-card">
            <div className="np-sos-alert-icon">
              <Siren size={32} />
            </div>

            <h2>Need emergency assistance?</h2>
            <p className="np-sos-description">
              Send an emergency SMS or contact
              national emergency services immediately.
            </p>

            <button
              type="button"
              className="np-sos-primary"
              onClick={sendEmergencySMS}
            >
              <Siren size={23} />
              <span>
                {t("sendEmergencySms") ||
                  "SEND EMERGENCY SMS"}
              </span>
            </button>

            <p className="np-sos-note">
              Opens your phone's SMS application.
              You must confirm sending the message.
            </p>

            {sosStatus && (
              <div
                className={`np-sos-status ${
                  sosError ? "error" : "success"
                }`}
                role="status"
              >
                {sosError ? (
                  <AlertCircle size={20} />
                ) : (
                  <CheckCircle2 size={20} />
                )}

                <span>{sosStatus}</span>
              </div>
            )}
          </section>

          <section className="np-sos-section">
            <div className="np-sos-section-title">
              <Phone size={19} />
              <h2>National Helplines</h2>
            </div>

            <div className="np-sos-helplines">
              <button
                type="button"
                onClick={call999}
                className="np-sos-call-button"
              >
                <div className="np-sos-call-icon">
                  <Phone size={21} />
                </div>

                <span>
                  <strong>999</strong>
                  <small>National Emergency</small>
                </span>

                <span className="np-sos-call-label">
                  Call
                </span>
              </button>

              <button
                type="button"
                onClick={call109}
                className="np-sos-call-button"
              >
                <div className="np-sos-call-icon">
                  <Phone size={21} />
                </div>

                <span>
                  <strong>109</strong>
                  <small>Women & Children Helpline</small>
                </span>

                <span className="np-sos-call-label">
                  Call
                </span>
              </button>
            </div>
          </section>

          <section className="np-sos-section">
            <div className="np-sos-section-title">
              <MapPin size={19} />
              <h2>Live Location Sharing</h2>
            </div>

            <div className="np-sos-live-card">
              <p className="np-sos-live-description">
                Share your live GPS location with
                trusted people for up to 60 minutes.
              </p>

              {!sharing ? (
                <button
                  type="button"
                  className="np-sos-live-start"
                  onClick={startLiveSharing}
                >
                  <MapPin size={19} />
                  Start Live Location
                </button>
              ) : (
                <div className="np-sos-sharing-active">
                  <div className="np-sos-live-indicator">
                    <span className="np-sos-live-dot" />
                    Live Sharing Active
                  </div>

                  <p>
                    Share this link with someone
                    you trust:
                  </p>

                  <div className="np-sos-share-link">
                    {shareUrl}
                  </div>

                  <div className="np-sos-share-actions">
                    <button
                      type="button"
                      onClick={copyShareLink}
                    >
                      {copied ? (
                        <CheckCircle2 size={17} />
                      ) : (
                        <Copy size={17} />
                      )}
                      {copied ? "Copied" : "Copy"}
                    </button>

                    <button
                      type="button"
                      onClick={shareLiveLink}
                    >
                      <Share2 size={17} />
                      Share
                    </button>
                  </div>

                  <button
                    type="button"
                    className="np-sos-stop"
                    onClick={stopLiveSharing}
                  >
                    <Square size={17} />
                    Stop Sharing
                  </button>
                </div>
              )}

              {liveError && (
                <p className="np-sos-live-error" role="alert">
                  <AlertCircle size={17} />
                  {liveError}
                </p>
              )}
            </div>
          </section>

          <div className="np-sos-footer">
            <ShieldCheck size={17} />
            <span>
              Your safety matters. Stay connected.
            </span>
          </div>
        </div>
      </main>
    </Layout>
  );
}
