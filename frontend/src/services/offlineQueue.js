const QUEUE_KEY = "nirapod_offline_queue";
const MAX_ATTEMPTS = 5;

function readQueue() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeQueue(items) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

function uid() {
  return `oq_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Add report or SOS when offline / failed network */
export function enqueueOfflineItem({ type, payload }) {
  const items = readQueue();
  const item = {
    clientId: uid(),
    type, // "report" | "sos"
    payload,
    status: "pending",
    attempts: 0,
    createdAt: Date.now(),
    lastError: null,
  };
  items.push(item);
  writeQueue(items);
  return item;
}

export function getOfflineQueue() {
  return readQueue();
}

export function getPendingCount() {
  return readQueue().filter((i) => i.status === "pending" || i.status === "failed").length;
}

export function removeOfflineItem(clientId) {
  writeQueue(readQueue().filter((i) => i.clientId !== clientId));
}

export function clearSentOlderThan(ms = 24 * 60 * 60 * 1000) {
  const now = Date.now();
  writeQueue(
    readQueue().filter((i) => {
      if (i.status === "sent" && now - (i.sentAt || i.createdAt) > ms) return false;
      if (i.status === "failed" && now - i.createdAt > 7 * 24 * 60 * 60 * 1000) return false;
      return true;
    })
  );
}

/**
 * Flush queue using existing api() helper.
 * sendFn(item) should return a Promise.
 */
export async function flushOfflineQueue(sendFn) {
  clearSentOlderThan();
  const items = readQueue();
  const pending = items.filter(
    (i) => (i.status === "pending" || i.status === "failed") && i.attempts < MAX_ATTEMPTS
  );

  for (const item of pending) { 
    // mark sending
    item.status = "sending";
    item.attempts += 1;
    writeQueue(items);

    try {
      await sendFn(item);
      item.status = "sent";
      item.sentAt = Date.now();
      item.lastError = null;
    } catch (err) {
      item.status = item.attempts >= MAX_ATTEMPTS ? "failed" : "pending";
      item.lastError = err?.message || "Send failed";
    }
    writeQueue(items);
  }

  return getOfflineQueue();
}

export function isOnline() {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
} 