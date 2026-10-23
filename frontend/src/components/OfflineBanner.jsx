import React from "react";
import useOfflineQueue from "../hooks/useOfflineQueue";

export default function OfflineBanner() {
  const { online, pendingCount, syncing, sync } = useOfflineQueue();

  if (online && pendingCount === 0) return null;

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        padding: "10px 14px",
        background: online ? "#f5f3ff" : "#fef2f2",
        color: online ? "#5b21b6" : "#991b1b",
        borderBottom: "1px solid #e9e1f3",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      <span>
        {!online
          ? "You are offline. Reports/SOS logs will queue locally."
          : `${pendingCount} item(s) waiting to sync.`}
        {syncing ? " Syncing…" : ""}
      </span>
      {online && pendingCount > 0 && (
        <button
          type="button"
          onClick={sync}
          style={{
            border: 0,
            background: "#5b2bd9",
            color: "#fff",
            borderRadius: 10,
            padding: "6px 12px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Retry now
        </button>
      )}
    </div>
  );
} 