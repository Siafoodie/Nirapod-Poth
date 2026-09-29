import React, { useState, useEffect } from "react";
import useGeolocation from "../hooks/useGeolocation"; 
import { api } from "../api";                        

const ImSafeButton = () => {
  // ===== ORIGINAL STATE (edited) =====
  const [showPopup, setShowPopup] = useState(false);

  // ===== NEW STATES (added) =====
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [includeLocation, setIncludeLocation] = useState(true);
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  // ===== GEOLOCATION HOOK (added) =====
  const { error, loading, getCurrentPosition, getMapsLink } = useGeolocation();

  // ===== LOAD TRUSTED CONTACTS (added) =====
  useEffect(() => {
    api("/contacts")
      .then((data) => {
        const list = Array.isArray(data) ? data : data.contacts || [];
        setContacts(list);
        setSelectedContacts(list.slice(0, 2).map((c) => c._id));
      })
      .catch(() => {
        setContacts([]);
      });
  }, []);

  // ===== TOGGLE CONTACT (added) =====
  const toggleContact = (id) => {
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // ===== FULL SEND LOGIC (added) =====
  const handleSendCheckIn = async () => {
    if (selectedContacts.length === 0) {
      setStatus("Please select at least one trusted contact.");
      return;
    }

    setSending(true);
    setStatus("");

    try {
      let message = "I'm safe. – Sent via Nirapod Poth";
      let coords = null;

      if (includeLocation) {
        coords = await getCurrentPosition();
        const mapsLink = getMapsLink(coords);
        message = `I'm safe. My current location: ${mapsLink}`;
      }

      // Backend call 
      try {
        await api("/checkin", {
          method: "POST",
          body: JSON.stringify({
            contactIds: selectedContacts,
            includeLocation,
            location: coords,
          }),
        });
      } catch (err) {
        console.warn("Backend check-in failed, continuing with SMS", err);
      }

      // Open SMS app
      window.location.href = `sms:?body=${encodeURIComponent(message)}`;

      const names = contacts
        .filter((c) => selectedContacts.includes(c._id))
        .map((c) => c.name)
        .join(", ");

      setStatus(`Check-in prepared for: ${names}`);
      setShowPopup(true); // ← ORIGINAL popup still used
    } catch (err) {
      setStatus(err.message || "Failed to get location. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6">
      {/* ===== ORIGINAL BUTTON ( onClick upgraded) ===== */}
      <button
        onClick={handleSendCheckIn}
        disabled={sending || loading}
        className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-60"
      >
        {sending || loading ? "Getting location..." : "I'm Safe"}
      </button>

      {/* ===== NEW UI (added below original button) ===== */}
      <label className="mt-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={includeLocation}
          onChange={(e) => setIncludeLocation(e.target.checked)}
        />
        Include current location
      </label>

      {contacts.length > 0 && (
        <div className="mt-4 w-full max-w-xs">
          <p className="text-sm font-medium mb-2">Send to:</p>
          {contacts.map((c) => (
            <label key={c._id} className="flex items-center gap-2 mb-1">
              <input
                type="checkbox"
                checked={selectedContacts.includes(c._id)}
                onChange={() => toggleContact(c._id)}
              />
              <span>
                {c.name} <small className="text-gray-500">({c.phone})</small>
              </span>
            </label>
          ))}
        </div>
      )}

      {status && (
        <p
          className={`mt-3 text-sm ${
            status.includes("Failed") || status.includes("Please")
              ? "text-red-600"
              : "text-green-600"
          }`}
        >
          {status}
        </p>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {/* ===== POPUP ===== */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40">
          <div className="bg-white p-6 rounded-xl shadow-lg text-center w-80">
            <h2 className="text-xl font-bold mb-2">
              Safety Check-In
            </h2>

            <p className="text-gray-600 mb-4">
              Your safety status has been confirmed.
            </p>

            <button
              onClick={() => setShowPopup(false)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImSafeButton; 