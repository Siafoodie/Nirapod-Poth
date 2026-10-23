import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import {
  flushOfflineQueue,
  getOfflineQueue,
  getPendingCount,
  isOnline,
} from "../services/offlineQueue";

async function sendItem(item) {
  if (item.type === "report") {
    return api("/reports", {
      method: "POST",
      body: JSON.stringify({ ...item.payload, clientId: item.clientId }),
    });
  }
  if (item.type === "sos") {
    return api("/sos/offline", {
      method: "POST",
      body: JSON.stringify({ ...item.payload, clientId: item.clientId }),
    });
  }
  throw new Error("Unknown offline item type");
}

export default function useOfflineQueue() {
  const [queue, setQueue] = useState(() => getOfflineQueue());
  const [online, setOnline] = useState(isOnline());
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(() => {
    setQueue(getOfflineQueue());
  }, []);

  const sync = useCallback(async () => {
    if (!isOnline() || syncing) return;
    setSyncing(true);
    try {
      await flushOfflineQueue(sendItem);
      refresh();
    } finally {
      setSyncing(false);
    }
  }, [refresh, syncing]);

  useEffect(() => {
    const onOnline = () => {
      setOnline(true);
      sync();
    };
    const onOffline = () => setOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    if (isOnline()) sync();

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [sync]);

  return {
    queue,
    online,
    syncing,
    pendingCount: getPendingCount(),
    sync,
    refresh,
  };
} 