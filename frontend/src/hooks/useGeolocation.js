import { useState } from "react";

export default function useGeolocation() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Get user's current location
  const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const message = "Geolocation is not supported by this browser.";

        setError(message);
        reject(new Error(message));
        return;
      }

      setLoading(true);
      setError("");

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          setLoading(false);
          setError("");

          resolve(coords);
        },

        (err) => {
          setLoading(false);
          setError(err.message);

          reject(err);
        }
      );
    });
  };

  // Generate Google Maps link from coordinates
  const getMapsLink = (coords) => {
    if (!coords || coords.lat == null || coords.lng == null) {
      return "";
    }

    return `https://www.google.com/maps?q=${coords.lat},${coords.lng}`;
  };

  return {
    error,
    loading,
    getCurrentPosition,
    getMapsLink,
  };
}