import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import useGeolocation from "./useGeolocation";

const INTERVAL_MS = 10000;

export default function useLiveShare() {
  const { getCurrentPosition } = useGeolocation();
  const [session, setSession] = useState(null); // { shareToken, expiresAt, shareUrl }
  const [error, setError] = useState("");
  const [sharing, setSharing] = useState(false);
  const timer = useRef(null);

  const pushLocation = async (token) => {
    try {
      const pos = await getCurrentPosition();
      const lat = pos.lat ?? pos.latitude;
      const lng = pos.lng ?? pos.longitude;
      await api(`/live/${token}/location`, {
        method: "POST",
        body: JSON.stringify({ lat, lng }),
      });
    } catch (e) {
      setError(e.message || "Could not update location");
    }
  };

  const start = async (contactIds = []) => {
    setError("");
    try {
      const pos = await getCurrentPosition();
      const lat = pos.lat ?? pos.latitude;
      const lng = pos.lng ?? pos.longitude;
      const data = await api("/live/start", {
        method: "POST",
        body: JSON.stringify({ contactIds, lat, lng }),
      });
      setSession(data);
      setSharing(true);
      timer.current = setInterval(() => pushLocation(data.shareToken), INTERVAL_MS);
      return data;
    } catch (e) {
      setError(
        e.message?.includes("permission") || e.message?.includes("Location")
          ? "Location permission denied. Enable GPS to share live location."
          : e.message || "Could not start live sharing"
      );
      setSharing(false);
      return null;
    }
  };

  const stop = async () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    if (session?.shareToken) {
      try {
        await api(`/live/${session.shareToken}/stop`, { method: "POST" });
      } catch {
        /* ignore */
      }
    }
    setSharing(false);
    setSession(null);
  };

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  return { session, sharing, error, start, stop };
}  