
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API_BASE = "http://localhost:5000";
const REFRESH_MS = 10000;

export default function LiveLocationViewer() {
  const { shareToken } = useParams();

  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    if (!shareToken) {
      setStatus("error");
      setError("Invalid sharing link.");
      return;
    }

    let cancelled = false;
    let timer = null;
    const controller = new AbortController();

    const fetchLocation = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/api/live/${encodeURIComponent(shareToken)}`,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? "Sharing link not found."
              : "Unable to load live location."
          );
        }

        const data = await response.json();

        if (cancelled) return;

        // Check whether session has expired
        const expired =
          data.expiresAt &&
          new Date(data.expiresAt).getTime() <= Date.now();

        if (expired) {
          setStatus("expired");
          setLocation(null);
          return;
        }

        // Check whether sharing is stopped
        if (data.active === false) {
          setStatus("stopped");
          setLocation(null);
          return;
        }

        // Match backend response structure
        const latitude = data.lastLocation?.lat;
        const longitude = data.lastLocation?.lng;

        if (
          typeof latitude !== "number" ||
          typeof longitude !== "number" ||
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude) ||
          latitude < -90 ||
          latitude > 90 ||
          longitude < -180 ||
          longitude > 180
        ) {
          setLocation(null);
          setStatus("waiting");
          return;
        }

        setLocation({
          latitude,
          longitude,
        });

        setLastUpdated(data.lastLocation?.at || null);
        setStatus("active");
        setError("");
      } catch (err) {
        if (cancelled || err.name === "AbortError") return;

        setStatus("error");
        setError(err.message || "Failed to fetch location.");
      } finally {
        if (!cancelled) {
          timer = setTimeout(fetchLocation, REFRESH_MS);
        }
      }
    };

    fetchLocation();

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [shareToken]);

  const mapUrl = location
    ? `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
    : "";

  const cardStyle = {
    maxWidth: 650,
    margin: "40px auto",
    padding: 32,
    background: "#ffffff",
    borderRadius: 20,
    boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
    textAlign: "center",
  };

  return (
    <main style={cardStyle}>
      <h2
        style={{
          color: "#5b21b6",
          marginBottom: 24,
        }}
      >
        Nirapod Poth – Live Location
      </h2>

      {status === "loading" && (
        <p>Loading shared location...</p>
      )}

      {status === "waiting" && (
        <p>Waiting for the first GPS location update...</p>
      )}

      {status === "error" && (
        <p role="alert" style={{ color: "#b91c1c" }}>
          {error}
        </p>
      )}

      {status === "expired" && (
        <p style={{ color: "#b91c1c", fontWeight: 700 }}>
          This live location session has expired.
        </p>
      )}

      {status === "stopped" && (
        <p style={{ color: "#b91c1c", fontWeight: 700 }}>
          Live location sharing has been stopped.
        </p>
      )}

      {status === "active" && location && (
        <>
          <p
            style={{
              color: "#16a34a",
              fontWeight: 700,
              fontSize: 18,
            }}
          >
            ● Live Location Available
          </p>

          <div
            style={{
              background: "#f5f3ff",
              padding: 20,
              borderRadius: 14,
              marginTop: 20,
              textAlign: "left",
            }}
          >
            <p>
              <strong>Latitude:</strong>{" "}
              {location.latitude}
            </p>

            <p>
              <strong>Longitude:</strong>{" "}
              {location.longitude}
            </p>

            {lastUpdated && (
              <p>
                <strong>Last GPS Update:</strong>{" "}
                {new Date(lastUpdated).toLocaleString()}
              </p>
            )}
          </div>

          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              padding: 15,
              background: "#693ed8",
              color: "#ffffff",
              borderRadius: 12,
              textDecoration: "none",
              fontWeight: 700,
              marginTop: 20,
            }}
          >
            View Location on Google Maps
          </a>
        </>
      )}

      <p
        style={{
          fontSize: 12,
          color: "#777",
          marginTop: 24,
        }}
      >
        Location refreshes every 10 seconds while sharing
        is active.
      </p>
    </main>
  );
}
