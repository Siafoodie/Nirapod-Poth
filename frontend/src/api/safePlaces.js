const PHOTON_URL = "https://photon.komoot.io/api/";
const REQUEST_TIMEOUT_MS = 12000;
const REQUEST_INTERVAL_MS = 1100;
const PLACE_CATEGORIES = [
  { id: "hospital", query: "hospital", osmTag: "amenity:hospital" },
  { id: "pharmacy", query: "pharmacy", osmTag: "amenity:pharmacy" },
  { id: "police", query: "police station", osmTag: "amenity:police" },
  { id: "shelter", query: "shelter", osmTag: "amenity:shelter" },
  {
    id: "fire-station",
    query: "fire station",
    osmTag: "amenity:fire_station",
  },
];

let lastNominatimRequest = 0;

const parseCoordinates = (latitude, longitude) => {
  const lat = Number(latitude);
  const lon = Number(longitude);
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    return null;
  }
  return { lat, lon };
};

const isExpectedPlaceType = (place, category) => {
  if (category === "hospital") {
    return (
      (place.osm_key === "amenity" &&
        ["hospital", "clinic", "doctors"].includes(place.osm_value)) ||
      (place.osm_key === "healthcare" &&
        ["hospital", "clinic"].includes(place.osm_value))
    );
  }
  if (category === "pharmacy") {
    return (
      (place.osm_key === "amenity" && place.osm_value === "pharmacy") ||
      (place.osm_key === "shop" &&
        ["chemist", "medical_supply"].includes(place.osm_value))
    );
  }
  if (category === "police") {
    return place.osm_key === "amenity" && place.osm_value === "police";
  }
  if (category === "fire-station") {
    return place.osm_key === "amenity" && place.osm_value === "fire_station";
  }
  return place.osm_value === "shelter";
};

const toSafePlace = (feature, category) => {
  const place = feature.properties || {};
  const [longitude, latitude] = feature.geometry?.coordinates || [];
  const coordinates = parseCoordinates(latitude, longitude);
  const name =
    place.name ||
    place.street ||
    place.locality ||
    place.district;

  if (!coordinates || !name || !isExpectedPlaceType(place, category)) {
    return null;
  }

  const address = [
    place.housenumber,
    place.street,
    place.locality,
    place.district,
    place.city,
    place.state,
  ]
    .filter((part, index, parts) => part && parts.indexOf(part) === index)
    .join(", ");

  return {
    id: `osm-${place.osm_type}-${place.osm_id || place.place_id}`,
    name,
    category,
    address,
    latitude: coordinates.lat,
    longitude: coordinates.lon,
    coordinates: [coordinates.lon, coordinates.lat],
    phone: "",
    isOpen247: false,
  };
};

const waitForNominatim = async () => {
  const delay = Math.max(
    0,
    REQUEST_INTERVAL_MS - (Date.now() - lastNominatimRequest),
  );
  if (delay) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  lastNominatimRequest = Date.now();
};

const searchPhoton = async (url) => {
  await waitForNominatim();

  let response;
  try {
    response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Could not connect to OpenStreetMap place search.");
    }
    throw error;
  }

  if (!response.ok) {
    throw new Error(`OpenStreetMap place search returned status ${response.status}.`);
  }

  return response.json();
};

export async function searchSafePlaceLocation(query) {
  const url = new URL(PHOTON_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "1");

  const result = (await searchPhoton(url)).features?.[0];
  if (!result) {
    throw new Error("No matching location found. Try a nearby area or landmark.");
  }

  const [longitude, latitude] = result.geometry?.coordinates || [];
  const coordinates = parseCoordinates(latitude, longitude);
  if (!coordinates) {
    throw new Error("Location search returned invalid map coordinates.");
  }
  const properties = result.properties || {};
  const displayName = [
    properties.name,
    properties.street,
    properties.locality,
    properties.district,
    properties.city,
    properties.state,
    properties.country,
  ]
    .filter((part, index, parts) => part && parts.indexOf(part) === index)
    .join(", ");

  return {
    name: properties.name || displayName,
    displayName,
    coordinates: [coordinates.lat, coordinates.lon],
  };
}

export async function getNearbySafePlaces(
  [latitude, longitude],
  radiusKm = 5,
) {
  const center = parseCoordinates(latitude, longitude);
  if (!center || !Number.isFinite(radiusKm) || radiusKm <= 0) {
    throw new Error("A valid map location is required to find nearby places.");
  }

  const latitudeDelta = radiusKm / 111;
  const longitudeDelta =
    radiusKm / (111 * Math.max(0.01, Math.cos((center.lat * Math.PI) / 180)));
  const boundingBox = [
    Math.max(-180, center.lon - longitudeDelta),
    Math.max(-90, center.lat - latitudeDelta),
    Math.min(180, center.lon + longitudeDelta),
    Math.min(90, center.lat + latitudeDelta),
  ].join(",");
  const places = [];

  for (const category of PLACE_CATEGORIES) {
    const url = new URL(PHOTON_URL);
    url.searchParams.set("q", category.query);
    url.searchParams.set("limit", "8");
    url.searchParams.set("bbox", boundingBox);
    url.searchParams.set("osm_tag", category.osmTag);

    const results = await searchPhoton(url);
    places.push(
      ...(results.features || [])
        .map((place) => toSafePlace(place, category.id))
        .filter(Boolean),
    );
  }

  return [...new Map(places.map((place) => [place.id, place])).values()];
}
