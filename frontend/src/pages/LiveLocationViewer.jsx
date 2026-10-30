
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./LiveLocationViewer.css";

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
    let controller = null;

    const fetchLocation = async () => {
      controller = new AbortController();

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

        const expired =
          data.expiresAt &&
          new Date(data.expiresAt).getTime() <= Date.now();

        if (expired) {
          setStatus("expired");
          setLocation(null);
          setLastUpdated(null);
          return;
        }

        if (data.active === false) {
          setStatus("stopped");
          setLocation(null);
          setLastUpdated(null);
          return;
        }

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
          setLastUpdated(null);
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
      controller?.abort();
      clearTimeout(timer);
    };
  }, [shareToken]);

  const mapUrl = location
    ? `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
    : "";

  return (
    <div className="np-live-page">
      <main className="np-live-card">
        <h2 className="np-live-title">
          Nirapod Poth – Live Location
        </h2>

        {status === "loading" && (
          <p className="np-live-message">
            Loading shared location...
          </p>
        )}

        {status === "waiting" && (
          <p className="np-live-message">
            Waiting for the first GPS location update...
          </p>
        )}

        {status === "error" && (
          <p role="alert" className="np-live-error">
            {error}
          </p>
        )}

        {status === "expired" && (
          <p className="np-live-error np-live-bold">
            This live location session has expired.
          </p>
        )}

        {status === "stopped" && (
          <p className="np-live-error np-live-bold">
            Live location sharing has been stopped.
          </p>
        )}

        {status === "active" && location && (
          <>
            <p className="np-live-active">
              ● Live Location Available
            </p>

            <div className="np-live-details">
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
              className="np-live-map-button"
            >
              View Location on Google Maps
            </a>
          </>
        )}

        <p className="np-live-footer">
          Location refreshes every 10 seconds while
          sharing is active.
        </p>
      </main>
    </div>
  );
}
