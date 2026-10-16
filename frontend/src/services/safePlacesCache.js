const CACHE_KEY = "nirapod_safe_places_v1";
const CACHE_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

export function loadCachedSafePlaces() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.savedAt || !Array.isArray(parsed.data)) return null;
    if (Date.now() - parsed.savedAt > CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function saveCachedSafePlaces(data) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ savedAt: Date.now(), data })
    );
  } catch {
    // ignore quota errors
  }
} 