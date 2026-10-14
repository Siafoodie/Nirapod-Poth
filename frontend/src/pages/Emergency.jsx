import React, { useState } from "react";
import { Phone, MessageSquare, Crosshair, Users, CheckCircle2, X } from "lucide-react";
import Layout from "../components/Layout";
import { Row } from "../components/UI";
import { useLanguage } from "../context/LanguageContext";

const mapsLink = (p) =>
  `https://maps.google.com/?q=${p.coords.latitude},${p.coords.longitude}`;

export default function Emergency() {
  const { t } = useLanguage();
  const [active, setActive] = useState(false);
  const [locationLink, setLocationLink] = useState("");
  const [status, setStatus] = useState("");

  const getLocation = (done) => {
    if (!navigator.geolocation) {
      setStatus(
        t("locationNotSupported") ||
          "SOS activated. Location is not supported on this device."
      );
      done?.("");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const link = mapsLink(p);
        setLocationLink(link);
        setStatus(t("locationCaptured") || "Location captured successfully.");
        done?.(link);
      },
      () => {
        setStatus(
          t("locationUnavailable") ||
            "SOS activated. Location permission was unavailable."
        );
        done?.("");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  };

  // Instant SOS (no hold)
  const activateSOS = () => {
    if (active) return;
    setActive(true);
    setStatus(t("sosActivated") || "SOS ACTIVATED — preparing emergency options...");
    getLocation((link) => {
      const msg = `EMERGENCY! I need help.${
        link ? ` My current location: ${link}` : ""
      }`;
      location.href = `sms:?body=${encodeURIComponent(msg)}`;
    });
  };

  const sms = (text) => {
    location.href = `sms:?body=${encodeURIComponent(text)}`;
  };

  const sendLocation = () =>
    getLocation((link) =>
      sms(
        `EMERGENCY! I need help.${link ? ` My current location: ${link}` : ""}`
      )
    );

  const shareLocation = () =>
    getLocation(async (link) => {
      if (!link) return;
      try {
        await navigator.clipboard.writeText(link);
        setStatus(
          t("locationCopied") || "Location link copied. You can now share it."
        );
      } catch {
        setStatus(`Location: ${link}`);
      }
    });

  const alertContacts = () =>
    getLocation((link) =>
      sms(
        `Emergency alert from Nirapod Poth. I need help.${
          link ? ` My location: ${link}` : ""
        }`
      )
    );

  return (
    <Layout title={t("emergency") || "Emergency"} menu>
      <div className="emergency-banner">
        <h1>
          {t("emergency") || "Emergency"}
          <br />
          {t("support") || "support"}
        </h1>
      </div>

      {/* Instant click SOS button */}
      <div
        className={`sos ${active ? "activated" : ""}`}
        onClick={activateSOS}
        style={{ cursor: "pointer" }}
      >
        <b>{active ? "✓" : "SOS"}</b>
        <span>
          {active
            ? t("sosActivated") || "ACTIVATED"
            : t("sendEmergencySms") || "TAP TO SEND SOS"}
        </span>
      </div>

      {(active || status) && (
        <div className={`sos-status ${active ? "success" : ""}`}>
          <div>
            {active ? <CheckCircle2 /> : <X />}
            <strong>
              {active
                ? t("sosActivated") || "SOS ACTIVATED"
                : t("sosStatus") || "SOS STATUS"}
            </strong>
          </div>
          <p>{status}</p>
          {locationLink && (
            <small>
              {t("locationReady") || "Current location is ready to share."}
            </small>
          )}
        </div>
      )}

      {active && (
        <div className="sos-actions">
          <button
            className="sos-call"
            onClick={() => (location.href = "tel:999")}
          >
            <Phone /> {t("call999") || "Call 999"} Now
          </button>
          <button onClick={sendLocation}>
            <MessageSquare /> {t("sendEmergencySms") || "Send Emergency SMS"}
          </button>
          <button onClick={alertContacts}>
            <Users /> {t("alertTrustedContacts") || "Alert Trusted Contacts"}
          </button>
        </div>
      )}

      <h3>{t("emergencyActions") || "Emergency Actions"}</h3>
      <div className="stack">
        <Row icon={<Phone />} onClick={() => (location.href = "tel:999")}>
          {t("callEmergencyService") || "Call Emergency Service"}
        </Row>
        <Row icon={<MessageSquare />} onClick={sendLocation}>
          {t("sendLocationSms") || "Send Location via SMS"}
        </Row>
        <Row icon={<Crosshair />} onClick={shareLocation}>
          {t("shareLiveLocation") || "Share Live Location"}
        </Row>
        <Row icon={<Users />} onClick={alertContacts}>
          {t("alertTrustedContacts") || "Alert Trusted Contacts"}
        </Row>
      </div>

      <h3>{t("offlineHelplines") || "Offline Helplines"}</h3>
      <Row
        right={
          <button
            className="call-now"
            onClick={(e) => {
              e.stopPropagation();
              location.href = "tel:999";
            }}
          >
            {t("callNow") || "Call Now"}
          </button>
        }
        onClick={() => (location.href = "tel:999")}
      >
        <b>999</b>　{t("nationalEmergency") || "National Emergency"}
      </Row>
      <Row
        right={
          <button
            className="call-now"
            onClick={(e) => {
              e.stopPropagation();
              location.href = "tel:109";
            }}
          >
            {t("callNow") || "Call Now"}
          </button>
        }
        onClick={() => (location.href = "tel:109")}
      >
        <b>109</b>　{t("womenHelpline") || "Women & Child Helpline"}
      </Row>
      <p className="offline-note">
        {t("offlineNote") ||
          "Works without internet. On a phone, tapping Call Now opens the dialer with the number ready."}
      </p>
    </Layout>
  );
} 