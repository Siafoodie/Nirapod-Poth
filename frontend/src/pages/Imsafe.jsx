import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { Button } from "../components/UI";
import { api } from "../api";
import useGeolocation from "../hooks/useGeolocation";

export default function ImSafe() {
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState([]);
  const [includeLocation, setIncludeLocation] = useState(true);

  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("");
  const [sending, setSending] = useState(false);

  const {
    getCurrentPosition,
    getMapsLink,
  } = useGeolocation();

  // ==========================================
  // Load Trusted Contacts
  // ==========================================
  useEffect(() => {
    const loadContacts = async () => {
      try {
        const data = await api("/contacts");

        const list = Array.isArray(data)
          ? data
          : data.contacts || [];

        setContacts(list);

        // Select first two contacts by default
        setSelected(
          list
            .slice(0, 2)
            .map((contact) => contact._id)
        );
      } catch (error) {
        setContacts([]);

        setStatus(
          "Failed to load trusted contacts."
        );

        setStatusType("error");
      }
    };

    loadContacts();
  }, []);

  // ==========================================
  // Select / Unselect Contact
  // ==========================================
  const toggleContact = (id) => {
    setSelected((current) =>
      current.includes(id)
        ? current.filter(
            (item) => item !== id
          )
        : [...current, id]
    );

    setStatus("");
    setStatusType("");
  };

  // ==========================================
  // Send I'm Safe
  // ==========================================
  const send = async () => {
    setStatus("");
    setStatusType("");

    // No trusted contacts
    if (contacts.length === 0) {
      setStatus(
        "No trusted contacts found. Please add a trusted contact first."
      );

      setStatusType("error");
      return;
    }

    // No selected contacts
    if (selected.length === 0) {
      setStatus(
        "Please select at least one trusted contact."
      );

      setStatusType("error");
      return;
    }

    setSending(true);

    try {
      // ======================================
      // Prepare Message
      // ======================================

      let message = "I'm safe.";

      if (includeLocation) {
        try {
          const coords =
            await getCurrentPosition();

          const mapsLink =
            getMapsLink(coords);

          message =
            `I'm safe. My current location: ${mapsLink}`;
        } catch (error) {
          console.warn(
            "Location unavailable. Sending without location."
          );

          message = "I'm safe.";
        }
      }

      // ======================================
      // Get Selected Trusted Contacts
      // ======================================

      const selectedContacts =
        contacts.filter((contact) =>
          selected.includes(contact._id)
        );

      // Get phone numbers
      const phoneNumbers =
        selectedContacts
          .map((contact) => contact.phone)
          .filter(Boolean);

      if (phoneNumbers.length === 0) {
        setStatus(
          "Selected contacts do not have valid phone numbers."
        );

        setStatusType("error");
        return;
      }

      // ======================================
      // Prepare SMS Link
      // ======================================

      const numbers =
        phoneNumbers.join(",");

      const encodedMessage =
        encodeURIComponent(message);

      /*
        Mobile browsers normally hand this URL
        to the phone's SMS application.

        Example:
        sms:017XXXXXXXX,018XXXXXXXX?body=I'm%20safe
      */

      const smsUrl =
        `sms:${numbers}?body=${encodedMessage}`;

      // ======================================
      // Show Confirmation
      // ======================================

      const names =
        selectedContacts
          .map((contact) => contact.name)
          .join(", ");

      setStatus(
        `Opening SMS for: ${names}`
      );

      setStatusType("success");

      // ======================================
      // Open SMS Application
      // ======================================

      window.location.href = smsUrl;

    } catch (err) {
      setStatus(
        err.message ||
          "Unable to prepare check-in. Please try again."
      );

      setStatusType("error");
    } finally {
      setSending(false);
    }
  };

  return (
    <Layout title="I'm Safe" back>

      {/* Check Icon */}
      <div className="safecheck">
        ✓
      </div>

      {/* Heading */}
      <div className="center">
        <h2>
          Safety Check-In
        </h2>

        <p>
          Send "I'm Safe" message to:
        </p>
      </div>

      {/* Trusted Contacts */}
      <div className="stack">

        {contacts.length > 0 ? (

          contacts.map((contact) => (

            <label
              className="contactcheck"
              key={contact._id}
            >

              <input
                type="checkbox"
                checked={
                  selected.includes(
                    contact._id
                  )
                }
                onChange={() =>
                  toggleContact(
                    contact._id
                  )
                }
              />

              <span>

                <b>
                  {contact.name}
                </b>

                <small>
                  {contact.phone}
                </small>

              </span>

            </label>

          ))

        ) : (

          <p className="muted">
            No trusted contacts found.
            Add trusted contacts from
            your profile first.
          </p>

        )}

      </div>

      {/* Location Toggle */}
      <div className="toggleline">

        <h2>
          Include current
          <br />
          location
        </h2>

        <input
          type="checkbox"
          checked={includeLocation}
          onChange={(event) => {
            setIncludeLocation(
              event.target.checked
            );

            setStatus("");
            setStatusType("");
          }}
        />

      </div>

      {/* Status Message */}
      {status && (

        <div
          className={
            statusType === "success"
              ? "success-message"
              : "error"
          }
          role="alert"
        >

          {status}

        </div>

      )}

      {/* Send Button */}
      <Button
        className="greenbtn"
        onClick={send}
        disabled={
          sending ||
          contacts.length === 0
        }
      >

        {sending
          ? "Preparing..."
          : statusType === "error"
          ? "Retry Check-In"
          : "Send I'm Safe"}

      </Button>

    </Layout>
  );
}