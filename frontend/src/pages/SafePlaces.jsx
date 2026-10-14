import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Crosshair,
  Flame,
  Hospital,
  MapPin,
  Navigation,
  Search,
  ShieldCheck,
} from "lucide-react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  getNearbySafePlaces,
  searchSafePlaceLocation,
} from "../api/safePlaces";
import useGeolocation from "../hooks/useGeolocation";

const DEFAULT_CENTER = [23.8103, 90.4125];
const FILTERS = [
  { id: "all", label: "All places" },
  { id: "police", label: "Police" },
  { id: "hospital", label: "Hospitals" },
  { id: "pharmacy", label: "Pharmacies" },
  { id: "shelter", label: "Safe spaces" },
  { id: "fire-station", label: "Fire stations" },
];

const getCoordinates = (place) => {
  const geoCoordinates = place.geo?.coordinates || place.coordinates;
  const latitude = Number(
    place.latitude ?? place.lat ?? (geoCoordinates && geoCoordinates[1]),
  );
  const longitude = Number(
    place.longitude ?? place.lng ?? (geoCoordinates && geoCoordinates[0]),
  );

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return [latitude, longitude];
};

const getCategory = (place) => {
  const category = `${place.category || ""} ${place.type || ""} ${
    place.placeType || ""
  } ${place.name || place.title || ""}`.toLowerCase();

  if (category.includes("fire")) return "fire-station";
  if (category.includes("police") || category.includes("law")) return "police";
  if (category.includes("hospital") || category.includes("clinic")) {
    return "hospital";
  }
  if (category.includes("pharmacy") || category.includes("pharma")) {
    return "pharmacy";
  }
  return "shelter";
};

const normalizePlace = (place) => {
  if (!place || typeof place !== "object") return null;

  const name = place.name || place.title;
  if (typeof name !== "string" || !name.trim()) return null;

  return {
    ...place,
    id: place._id || place.id || `${name}-${place.address || ""}`,
    name: name.trim(),
    address:
      typeof place.address === "string"
        ? place.address
        : typeof place.location === "string"
          ? place.location
          : "",
    category: getCategory(place),
    coordinates: getCoordinates(place),
  };
};

const getDirectionsUrl = (place) => {
  const destination = place.coordinates
    ? `${place.coordinates[0]},${place.coordinates[1]}`
    : [place.name, place.address].filter(Boolean).join(", ");
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    destination,
  )}`;
};

const getDistanceKm = (from, to) => {
  if (!from || !to) return null;
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const [lat1, lon1] = from.map(toRadians);
  const [lat2, lon2] = to.map(toRadians);
  const latitudeDelta = lat2 - lat1;
  const longitudeDelta = lon2 - lon1;
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(longitudeDelta / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const MapCenter = ({ center }) => {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);

  return null;
};

const markerIcons = {
  police: "P",
  hospital: "+",
  pharmacy: "Rx",
  shelter: "✓",
  "fire-station": "F",
};

const createMarkerIcon = (category) =>
  L.divIcon({
    className: "safe-place-marker-wrap",
    html: `<span class="safe-place-marker safe-place-marker-${category}"><i>${markerIcons[category]}</i></span>`,
    iconSize: [38, 46],
    iconAnchor: [19, 44],
    popupAnchor: [0, -42],
  });

export default function SafePlaces() {
  const [places, setPlaces] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [searching, setSearching] = useState(false);
  const [locationLabel, setLocationLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const { getCurrentPosition, loading: locating, error: locationError } =
    useGeolocation();

  const loadNearbyPlaces = async (coordinates) => {
    setLoading(true);
    setLoadError("");
    setSelectedId(null);

    try {
      const nearbyPlaces = await getNearbySafePlaces(coordinates);
      setPlaces(nearbyPlaces.map(normalizePlace).filter(Boolean));
      setMapCenter(coordinates);
    } catch (error) {
      setLoadError(error.message || "Unable to load nearby safe places.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNearbyPlaces(DEFAULT_CENTER);
  }, []);

  const filteredPlaces = useMemo(() => {
    const distanceOrigin = userLocation || (locationLabel ? mapCenter : null);
    return places
      .filter(
        (place) => activeFilter === "all" || place.category === activeFilter,
      )
      .sort((first, second) => {
        const firstDistance = getDistanceKm(
          distanceOrigin,
          first.coordinates,
        );
        const secondDistance = getDistanceKm(
          distanceOrigin,
          second.coordinates,
        );
        if (firstDistance === null) return 1;
        if (secondDistance === null) return -1;
        return firstDistance - secondDistance;
      });
  }, [activeFilter, locationLabel, mapCenter, places, userLocation]);

  const mapPlaces = filteredPlaces.filter((place) => place.coordinates);
  const center = userLocation || mapCenter;

  const searchLocation = async (event) => {
    event.preventDefault();
    const query = search.trim();
    if (query.length < 2) {
      setLoadError("Enter an area, address, or landmark to search.");
      return;
    }

    setSearching(true);
    setLoadError("");
    try {
      const location = await searchSafePlaceLocation(query);
      setLocationLabel(location.displayName || location.name);
      setUserLocation(null);
      await loadNearbyPlaces(location.coordinates);
    } catch (error) {
      setLoadError(error.message || "Unable to find that location.");
    } finally {
      setSearching(false);
    }
  };

  const locateMe = async () => {
    try {
      const position = await getCurrentPosition();
      const coordinates = [position.lat, position.lng];
      setLocationLabel("");
      setUserLocation(coordinates);
      await loadNearbyPlaces(coordinates);
    } catch (error) {
      setLoadError(error.message || "Unable to find your current location.");
    }
  };

  return (
    <main className="safe-directory">
      <header className="safe-directory-header">
        <Link
          className="safe-back"
          to="/"
          aria-label="Back to home"
        >
          <ArrowLeft size={21} />
        </Link>
        <div>
          <span className="safe-eyebrow">NIRAPOD POTH</span>
          <h1>Safe places</h1>
        </div>
        <ShieldCheck className="safe-header-icon" size={28} />
      </header>

      <section className="safe-intro">
        <h2>Find help nearby</h2>
        <p>Search an area to find nearby help and get directions.</p>
        <small>
          Place data ©{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
          >
            OpenStreetMap contributors
          </a>
        </small>
      </section>

      <form className="safe-search" onSubmit={searchLocation}>
        <Search size={20} aria-hidden="true" />
        <input
          aria-label="Search safe places"
          type="search"
          placeholder="Search area, address, or landmark"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <button
          type="submit"
          className="safe-locate"
          disabled={searching || loading}
          aria-label="Search this location"
          title="Search this location"
        >
          Search
        </button>
        <button
          type="button"
          className="safe-locate"
          onClick={locateMe}
          disabled={locating || loading}
          aria-label="Use my current location"
          title="Use my current location"
        >
          <Crosshair size={20} />
        </button>
      </form>
      {locationLabel && (
        <p className="safe-location-label">Showing places near {locationLabel}</p>
      )}
      {(loadError || locationError) && (
        <p className="safe-inline-error">{loadError || locationError}</p>
      )}

      <nav className="safe-filters" aria-label="Filter places by type">
        {FILTERS.map((filter) => (
          <button
            type="button"
            key={filter.id}
            className={activeFilter === filter.id ? "active" : ""}
            aria-pressed={activeFilter === filter.id}
            onClick={() => setActiveFilter(filter.id)}
          >
            {filter.label}
          </button>
        ))}
      </nav>

      <section className="safe-map-section" aria-label="Safe places map">
        <div className="safe-map-title">
          <div>
            <h2>Map view</h2>
            <span>
              {loading
                ? "Searching nearby places..."
                : mapPlaces.length
                ? `${mapPlaces.length} place${mapPlaces.length === 1 ? "" : "s"} shown`
                : "No places with map coordinates found nearby"}
            </span>
          </div>
          <MapPin size={20} aria-hidden="true" />
        </div>
        <MapContainer
          center={center}
          zoom={13}
          scrollWheelZoom={false}
          className="safe-map"
        >
          <MapCenter center={center} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {mapPlaces.map((place) => (
            <Marker
              key={place.id}
              position={place.coordinates}
              icon={createMarkerIcon(place.category)}
              eventHandlers={{ click: () => setSelectedId(place.id) }}
            >
              <Popup>
                <div className="safe-map-popup">
                  <strong>{place.name}</strong>
                  {place.address && <span>{place.address}</span>}
                  <a
                    href={getDirectionsUrl(place)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Navigation size={14} /> Navigate
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}
          {userLocation && (
            <Marker
              position={userLocation}
              icon={L.divIcon({
                className: "user-location-wrap",
                html: '<span class="user-location-dot"></span>',
                iconSize: [20, 20],
                iconAnchor: [10, 10],
              })}
            />
          )}
        </MapContainer>
      </section>

      <section className="safe-directory-list" aria-live="polite">
        <div className="safe-list-title">
          <div>
            <h2>Directory</h2>
            <span>
              {loading
                ? "Loading places..."
                : `${filteredPlaces.length} place${filteredPlaces.length === 1 ? "" : "s"}`}
            </span>
          </div>
        </div>

        {loadError && (
          <div className="safe-empty" role="status">
            <MapPin size={24} />
            <strong>Places unavailable</strong>
            <p>{loadError}</p>
          </div>
        )}

        {!loading && !loadError && filteredPlaces.length === 0 && (
          <div className="safe-empty" role="status">
            <MapPin size={24} />
            <strong>No places found</strong>
          <p>Try another area or choose a different category.</p>
          </div>
        )}

        <div className="safe-place-cards">
          {filteredPlaces.map((place) => {
            const distance = getDistanceKm(
              userLocation || (locationLabel ? mapCenter : null),
              place.coordinates,
            );
            const PlaceIcon =
              place.category === "hospital"
                ? Hospital
                : place.category === "fire-station"
                  ? Flame
                  : Building2;

            return (
              <article
                className={`safe-place-card ${
                  selectedId === place.id ? "selected" : ""
                }`}
                key={place.id}
                onClick={() => setSelectedId(place.id)}
              >
                <div
                  className={`safe-place-type safe-place-type-${place.category}`}
                >
                  <PlaceIcon size={21} aria-hidden="true" />
                </div>
                <div className="safe-place-info">
                  <span className="safe-place-category">
                    {place.category}
                  </span>
                  <h3>{place.name}</h3>
                  {place.address && <p>{place.address}</p>}
                  {distance !== null && (
                    <small>{distance.toFixed(1)} km away</small>
                  )}
                </div>
                <a
                  className="safe-directions"
                  href={getDirectionsUrl(place)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Navigate to ${place.name}`}
                  onClick={(event) => event.stopPropagation()}
                >
                  <Navigation size={17} />
                  <span>Go</span>
                </a>
              </article>
            );
          })}
        </div>
      </section>
      <div className="safe-directory-bottom-space" />
    </main>
  );
}
