import { useState } from "react";

const useGeolocation = () => {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const getCurrentPosition = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const unavailableError = new Error(
          "Location is not supported by this browser.",
        );
        setError(unavailableError.message);
        reject(unavailableError);
        return;
      }

      setLoading(true);
      setError("");
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          setLoading(false);
          resolve({ lat: coords.latitude, lng: coords.longitude });
        },
        (positionError) => {
          const locationError = new Error(
            positionError.message || "Unable to get your current location.",
          );
          setLoading(false);
          setError(locationError.message);
          reject(locationError);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    });

  const getMapsLink = (coords) => {
    if (!coords || coords.lat == null || coords.lng == null) {
      return "";
    }
    return `https://www.google.com/maps?q=${coords.lat},${coords.lng}`;
  };

  return { error, loading, getCurrentPosition, getMapsLink };
};

export default useGeolocation;
