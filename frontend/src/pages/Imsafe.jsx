
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Users,
  Send,
  Navigation,
  Sparkles,
  AlertCircle,
  LoaderCircle,
  UserPlus,
  Heart,
  MessageCircle,
} from "lucide-react";

import Layout from "../components/Layout";
import { api } from "../api";
import useGeolocation from "../hooks/useGeolocation";
import { useLanguage } from "../context/LanguageContext";

import "./Imsafe.css";

export default function ImSafe() {
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState([]);
  const [includeLocation, setIncludeLocation] = useState(true);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("");

  const { getCurrentPosition, getMapsLink } = useGeolocation();
  const { t } = useLanguage();

  const translate = (key, fallback) => {
    const value = t(key);
    return value && value !== key ? value : fallback;
  };

  useEffect(() => {
    let mounted = true;

    const loadContacts = async () => {
      try {
        const data = await api("/contacts");

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.contacts)
          ? data.contacts
          : Array.isArray(data?.data)
          ? data.data
          : [];

        if (!mounted) return;

        setContacts(list);

        setSelected(
          list.slice(0, 2).map((contact) => contact._id)
        );
      } catch (error) {
        if (!mounted) return;

        setContacts([]);
        setStatus(
          translate(
            "failedLoadContacts",
            "Failed to load trusted contacts."
          )
        );
        setStatusType("error");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadContacts();

    return () => {
      mounted = false;
    };
  }, []);

  const toggleContact = (id) => {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );

    setStatus("");
    setStatusType("");
  };

  const send = async () => {
    if (sending) return;

    setStatus("");
    setStatusType("");

    if (contacts.length === 0) {
      setStatus(
        translate(
          "noContactsFound",
          "No trusted contacts found. Please add a contact first."
        )
      );
      setStatusType("error");
      return;
    }

    if (selected.length === 0) {
      setStatus(
        translate(
          "selectAtLeastOne",
          "Please select at least one trusted contact."
        )
      );
      setStatusType("error");
      return;
    }

    setSending(true);

    try {
      let message = "I'm safe.";
      let locationUnavailable = false;

      if (includeLocation) {
        try {
          const coords = await getCurrentPosition();
          const mapsLink = getMapsLink(coords);

          if (mapsLink) {
            message = `I'm safe. My current location: ${mapsLink}`;
          } else {
            locationUnavailable = true;
          }
        } catch (error) {
          console.warn("Location unavailable:", error);
          locationUnavailable = true;
        }
      }

      const selectedContacts = contacts.filter((contact) =>
        selected.includes(contact._id)
      );

      const phoneNumbers = [
        ...new Set(
          selectedContacts
            .map((contact) => String(contact.phone || "").trim())
            .filter(Boolean)
        ),
      ];

      if (phoneNumbers.length === 0) {
        setStatus(
          translate(
            "noValidPhone",
            "Selected contacts do not have valid phone numbers."
          )
        );
        setStatusType("error");
        return;
      }

      const numbers = phoneNumbers.join(",");
      const encodedMessage = encodeURIComponent(message);
      const smsUrl = `sms:${numbers}?body=${encodedMessage}`;

      const names = selectedContacts
        .map((contact) => contact.name)
        .join(", ");

      setStatus(
        `${translate("openingSms", "Opening SMS for")}: ${names}.${
          locationUnavailable
            ? " Location was unavailable, so the message does not include your location."
            : ""
        } Please review and send the message in your SMS app.`
      );

      setStatusType("success");

      // Opens the device's SMS application.
      // The user must confirm sending the SMS there.
      window.location.href = smsUrl;
    } catch (error) {
      setStatus(
        error.message ||
          translate(
            "unableCheckIn",
            "Unable to prepare check-in. Please try again."
          )
      );

      setStatusType("error");
    } finally {
      setSending(false);
    }
  };

  return (
    <Layout title={translate("imSafe", "I'm Safe")} back>
      <main className="imsafe-page">

        {/* HERO */}
        <section className="imsafe-hero">
          <div className="imsafe-hero-label">
            <Sparkles size={17} />
            SAFETY CHECK-IN
          </div>

          <div className="imsafe-check-wrapper">
            <div className="imsafe-check-outer">
              <div className="imsafe-check-inner">
                <Check size={72} strokeWidth={2.8} />
              </div>
            </div>
          </div>

          <h1>
            {translate("safetyCheckIn", "Safety Check-In")}
          </h1>

          <p>
            Let your trusted people know you're safe
            and give them peace of mind.
          </p>

          <div className="imsafe-hero-badge">
            <ShieldCheck size={17} />
            Stay safe. Stay connected.
          </div>
        </section>

        {/* CONTACTS */}
        <section className="imsafe-section">
          <div className="imsafe-section-heading">
            <div className="imsafe-heading-icon">
              <Users size={22} />
            </div>

            <div>
              <h2>Trusted Contacts</h2>
              <p>
                {translate(
                  "sendImSafeMessage",
                  'Choose who will receive your "I’m Safe" message.'
                )}
              </p>
            </div>
          </div>

          <div className="imsafe-selection-info">
            <span>
              <CheckCircle2 size={17} />
              {selected.length} of {contacts.length} selected
            </span>

            <span className="imsafe-selection-label">
              Select recipients
            </span>
          </div>

          {loading ? (
            <div className="imsafe-loading">
              <LoaderCircle size={27} className="imsafe-spin" />
              Loading trusted contacts...
            </div>
          ) : contacts.length > 0 ? (
            <div className="imsafe-contacts">
              {contacts.map((contact) => {
                const isSelected = selected.includes(contact._id);

                return (
                  <label
                    className={`imsafe-contact-card ${
                      isSelected ? "selected" : ""
                    }`}
                    key={contact._id}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleContact(contact._id)}
                      aria-label={`Select ${contact.name}`}
                    />

                    <div className="imsafe-avatar">
                      {String(contact.name || "?")
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="imsafe-contact-details">
                      <strong>{contact.name}</strong>
                      <span>{contact.phone || "No phone number"}</span>
                    </div>

                    <div className="imsafe-contact-check">
                      {isSelected && <Check size={17} />}
                    </div>
                  </label>
                );
              })}
            </div>
          ) : (
            <div className="imsafe-empty">
              <Users size={36} />
              <h3>No trusted contacts yet</h3>
              <p>
                Add trusted contacts to share your safety
                check-in with people you trust.
              </p>

              <Link
                to="/trusted-contact"
                className="imsafe-add-contact"
              >
                <UserPlus size={18} />
                Add Trusted Contact
              </Link>
            </div>
          )}
        </section>

        {/* LOCATION */}
        <section className="imsafe-section imsafe-location-section">
          <div className="imsafe-location-content">
            <div className="imsafe-location-icon">
              <MapPin size={24} />
            </div>

            <div className="imsafe-location-text">
              <h2>
                {translate("includeLocation", "Share My Location")}
              </h2>
              <p>
                Include a Google Maps link to your current
                location in the SMS.
              </p>
            </div>
          </div>

          <label className="imsafe-switch">
            <input
              type="checkbox"
              checked={includeLocation}
              onChange={(event) => {
                setIncludeLocation(event.target.checked);
                setStatus("");
                setStatusType("");
              }}
              aria-label="Include current location in SMS"
            />
            <span className="imsafe-slider" />
          </label>
        </section>

        {includeLocation && (
          <div className="imsafe-location-note">
            <Navigation size={17} />
            Location permission will be requested when
            preparing your message.
          </div>
        )}

        {/* MESSAGE PREVIEW */}
        <section className="imsafe-preview">
          <div className="imsafe-preview-title">
            <MessageCircle size={19} />
            Message Preview
          </div>

          <p>
            "I'm safe."
            {includeLocation && (
              <span>
                {" "}
                Your current location link will be added
                if available.
              </span>
            )}
          </p>
        </section>

        {/* STATUS */}
        {status && (
          <div
            className={`imsafe-status ${
              statusType === "success" ? "success" : "error"
            }`}
            role="alert"
          >
            {statusType === "success" ? (
              <CheckCircle2 size={21} />
            ) : (
              <AlertCircle size={21} />
            )}

            <span>{status}</span>
          </div>
        )}

        {/* SEND */}
        <button
          type="button"
          className="imsafe-send-button"
          onClick={send}
          disabled={
            sending ||
            loading ||
            contacts.length === 0
          }
        >
          {sending ? (
            <>
              <LoaderCircle
                size={21}
                className="imsafe-spin"
              />
              Preparing Message...
            </>
          ) : (
            <>
              <Send size={21} />
              {translate(
                "sendImSafe",
                "Send I'm Safe Message"
              )}
            </>
          )}
        </button>

        <div className="imsafe-footer">
          <Heart size={17} />
          Your safety matters to the people who care about you.
        </div>

        <p className="imsafe-sms-note">
          Your phone's SMS application will open.
          You must confirm sending the message there.
          Standard SMS charges may apply.
        </p>
      </main>
    </Layout>
  );
}
