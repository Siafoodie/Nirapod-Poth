
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  loadCachedSafePlaces,
  saveCachedSafePlaces,
} from "../services/safePlacesCache";
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
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  getNearbySafePlaces,
  searchSafePlaceLocation,
} from "../api/safePlaces";
import useGeolocation from "../hooks/useGeolocation";

const DEFAULT_CENTER = [23.8103, 90.4125];

const RISK_API_URL =
  "http://localhost:5000/api/reports/police-risks";

// Development preview only.
// Test reports must not be published as real warnings.
const ENABLE_RISK_PREVIEW = import.meta.env.DEV;

const RISK_COLORS = {
  high: "#dc2626",
  medium: "#f59e0b",
  low: "#16a34a",
};

const createRiskIcon = (level) =>
  L.divIcon({
    className: "police-risk-marker-wrap",
    html: `<span style="
      display:flex;
      align-items:center;
      justify-content:center;
      width:30px;
      height:30px;
      border:3px solid white;
      border-radius:50%;
      background:${RISK_COLORS[level]};
      color:white;
      font-size:17px;
      font-weight:bold;
      box-shadow:0 2px 8px #0005;
    ">!</span>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });

const riskIcons = {
  high: createRiskIcon("high"),
  medium: createRiskIcon("medium"),
  low: createRiskIcon("low"),
};

const FILTERS = [
  { id: "all", label: "All places" },
  { id: "police", label: "Police" },
  { id: "hospital", label: "Hospitals" },
  { id: "pharmacy", label: "Pharmacies" },
  { id: "shelter", label: "Safe spaces" },
  { id: "fire-station", label: "Fire stations" },
];

const getCoordinates = (place) => {
  const geoCoordinates =
    place.geo?.coordinates ||
    place.location?.coordinates ||
    place.coordinates;

  const latitude = Number(
    place.latitude ??
      place.lat ??
      (geoCoordinates && geoCoordinates[1])
  );

  const longitude = Number(
    place.longitude ??
      place.lng ??
      (geoCoordinates && geoCoordinates[0])
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
  const category = `${
    place.category || ""
  } ${place.type || ""} ${
    place.placeType || ""
  } ${
    place.name || place.title || ""
  }`.toLowerCase();

  if (category.includes("fire")) {
    return "fire-station";
  }

  if (
    category.includes("police") ||
    category.includes("law")
  ) {
    return "police";
  }

  if (
    category.includes("hospital") ||
    category.includes("clinic")
  ) {
    return "hospital";
  }

  if (
    category.includes("pharmacy") ||
    category.includes("pharma")
  ) {
    return "pharmacy";
  }

  return "shelter";
};

const normalizePlace = (place) => {
  if (!place || typeof place !== "object") {
    return null;
  }

  const name = place.name || place.title;

  if (
    typeof name !== "string" ||
    !name.trim()
  ) {
    return null;
  }

  return {
    ...place,
    id:
      place._id ||
      place.id ||
      `${name}-${place.address || ""}`,
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
    : [place.name, place.address]
        .filter(Boolean)
        .join(", ");

  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    destination
  )}`;
};

const getDistanceKm = (from, to) => {
  if (!from || !to) return null;

  const toRadians = (degrees) =>
    (degrees * Math.PI) / 180;

  const [lat1, lon1] = from.map(toRadians);
  const [lat2, lon2] = to.map(toRadians);

  const latitudeDelta = lat2 - lat1;
  const longitudeDelta = lon2 - lon1;

  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(longitudeDelta / 2) ** 2;

  return (
    6371 *
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    )
  );
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
    html: `<span class="safe-place-marker safe-place-marker-${category}"><i>${
      markerIcons[category] || "?"
    }</i></span>`,
    iconSize: [38, 46],
    iconAnchor: [19, 44],
    popupAnchor: [0, -42],
  });

export default function SafePlaces() {
  const [places, setPlaces] = useState([]);
  const [activeFilter, setActiveFilter] =
    useState("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] =
    useState(null);
  const [userLocation, setUserLocation] =
    useState(null);
  const [mapCenter, setMapCenter] =
    useState(DEFAULT_CENTER);
  const [searching, setSearching] =
    useState(false);
  const [locationLabel, setLocationLabel] =
    useState("");
  const [loading, setLoading] =
    useState(true);
  const [loadError, setLoadError] =
    useState("");

  // Police risk states
  const [policeRisks, setPoliceRisks] =
    useState([]);
  const [showPoliceRisks, setShowPoliceRisks] =
    useState(false);
  const [riskLoading, setRiskLoading] =
    useState(false);
  const [riskError, setRiskError] =
    useState("");

  const {
    getCurrentPosition,
    loading: locating,
    error: locationError,
  } = useGeolocation();

  const loadNearbyPlaces = async (coordinates) => {
    setLoading(true);
    setLoadError("");
    setSelectedId(null);

    const cached = loadCachedSafePlaces();

    if (cached?.length) {
      setPlaces(
        cached
          .map(normalizePlace)
          .filter(Boolean)
      );
    }

    try {
      const nearbyPlaces =
        await getNearbySafePlaces(coordinates);

      const normalized = nearbyPlaces
        .map(normalizePlace)
        .filter(Boolean);

      setPlaces(normalized);
      setMapCenter(coordinates);

      saveCachedSafePlaces(normalized);

      setLoadError("");
    } catch (error) {
      if (!cached?.length) {
        setLoadError(
          error.message ||
            "Unable to load nearby safe places."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeLocation = async () => {
      try {
        const position =
          await getCurrentPosition();

        const coordinates = [
          position.lat ?? position.latitude,
          position.lng ?? position.longitude,
        ];

        setUserLocation(coordinates);
        setLocationLabel("");

        await loadNearbyPlaces(coordinates);
      } catch (error) {
        console.error(
          "Location error:",
          error.message
        );

        await loadNearbyPlaces(DEFAULT_CENTER);
      }
    };

    initializeLocation();
  }, []);

  // Fetch police risk assessments
  useEffect(() => {
    if (
      !ENABLE_RISK_PREVIEW ||
      !showPoliceRisks
    ) {
      setPoliceRisks([]);
      setRiskError("");
      setRiskLoading(false);
      return;
    }

    const controller = new AbortController();

    const loadPoliceRisks = async () => {
      setRiskLoading(true);
      setRiskError("");

      try {
        const response = await fetch(
          RISK_API_URL,
          {
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            "Failed to fetch police risk assessments."
          );
        }

        const result = await response.json();

        if (
          !result.success ||
          !Array.isArray(result.data)
        ) {
          throw new Error(
            "Invalid police risk API response."
          );
        }

        const validRisks = result.data.filter(
          (report) => {
            const coordinates =
              report.geo?.coordinates;

            return (
              ["high", "medium", "low"].includes(
                report.policeRiskLevel
              ) &&
              Array.isArray(coordinates) &&
              coordinates.length === 2 &&
              coordinates.every(
                Number.isFinite
              ) &&
              coordinates[0] >= -180 &&
              coordinates[0] <= 180 &&
              coordinates[1] >= -90 &&
              coordinates[1] <= 90
            );
          }
        );

        setPoliceRisks(validRisks);
      } catch (error) {
        if (error.name !== "AbortError") {
          setRiskError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setRiskLoading(false);
        }
      }
    };

    loadPoliceRisks();

    return () => controller.abort();
  }, [showPoliceRisks]);

  const filteredPlaces = useMemo(() => {
    const distanceOrigin =
      userLocation ||
      (locationLabel ? mapCenter : null);

    return places
      .filter(
        (place) =>
          activeFilter === "all" ||
          place.category === activeFilter
      )
      .sort((first, second) => {
        const firstDistance = getDistanceKm(
          distanceOrigin,
          first.coordinates
        );

        const secondDistance = getDistanceKm(
          distanceOrigin,
          second.coordinates
        );

        if (firstDistance === null) return 1;
        if (secondDistance === null) return -1;

        return firstDistance - secondDistance;
      });
  }, [
    activeFilter,
    locationLabel,
    mapCenter,
    places,
    userLocation,
  ]);

  const mapPlaces = filteredPlaces.filter(
    (place) => place.coordinates
  );

  const center = userLocation || mapCenter;

  const searchLocation = async (event) => {
    event.preventDefault();

    const query = search.trim();

    if (query.length < 2) {
      setLoadError(
        "Enter an area, address, or landmark to search."
      );
      return;
    }

    setSearching(true);
    setLoadError("");

    try {
      const location =
        await searchSafePlaceLocation(query);

      setLocationLabel(
        location.displayName || location.name
      );
      setUserLocation(null);

      await loadNearbyPlaces(
        location.coordinates
      );
    } catch (error) {
      setLoadError(
        error.message ||
          "Unable to find that location."
      );
    } finally {
      setSearching(false);
    }
  };

  const locateMe = async () => {
    try {
      const position =
        await getCurrentPosition();

      const coordinates = [
        position.lat ?? position.latitude,
        position.lng ?? position.longitude,
      ];

      setLocationLabel("");
      setUserLocation(coordinates);

      await loadNearbyPlaces(coordinates);
    } catch (error) {
      setLoadError(
        error.message ||
          "Unable to find your current location."
      );
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
          <span className="safe-eyebrow">
            NIRAPOD POTH
          </span>
          <h1>Safe places</h1>
        </div>

        <ShieldCheck
          className="safe-header-icon"
          size={28}
        />
      </header>

      <section className="safe-intro">
        <h2>Find help nearby</h2>

        <p>
          Search an area to find nearby help
          and get directions.
        </p>

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

      <form
        className="safe-search"
        onSubmit={searchLocation}
      >
        <Search
          size={20}
          aria-hidden="true"
        />

        <input
          aria-label="Search safe places"
          type="search"
          placeholder="Search area, address, or landmark"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
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
        <p className="safe-location-label">
          Showing places near {locationLabel}
        </p>
      )}

      {(loadError || locationError) && (
        <p className="safe-inline-error">
          {loadError || locationError}
        </p>
      )}

      <nav
        className="safe-filters"
        aria-label="Filter places by type"
      >
        {FILTERS.map((filter) => (
          <button
            type="button"
            key={filter.id}
            className={
              activeFilter === filter.id
                ? "active"
                : ""
            }
            aria-pressed={
              activeFilter === filter.id
            }
            onClick={() =>
              setActiveFilter(filter.id)
            }
          >
            {filter.label}
          </button>
        ))}
      </nav>

      {/* Police Risk Preview Controls */}
      {ENABLE_RISK_PREVIEW && (
        <section
          style={{
            margin: "16px 0",
            padding: "14px",
            background: "#f3e8ff",
            borderRadius: "12px",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={showPoliceRisks}
              onChange={(event) =>
                setShowPoliceRisks(
                  event.target.checked
                )
              }
            />

            <strong>
              Preview Police Risk Markers
              (Development Only)
            </strong>
          </label>

          {riskLoading && (
            <p>
              Loading police risk assessments...
            </p>
          )}

          {riskError && (
            <p
              role="alert"
              style={{ color: "#b91c1c" }}
            >
              {riskError}
            </p>
          )}

          {showPoliceRisks &&
            !riskLoading &&
            !riskError && (
              <p>
                {policeRisks.length} police
                risk assessment(s) loaded.
              </p>
            )}

          {showPoliceRisks &&
            policeRisks.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const report = policeRisks[0];

                  const [longitude, latitude] =
                    report.geo.coordinates;

                  setUserLocation(null);
                  setMapCenter([
                    latitude,
                    longitude,
                  ]);
                }}
                style={{
                  marginTop: "8px",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid #7c3aed",
                  cursor: "pointer",
                }}
              >
                Show First Police Risk on Map
              </button>
            )}
        </section>
      )}

      <section
        className="safe-map-section"
        aria-label="Safe places map"
      >
        <div className="safe-map-title">
          <div>
            <h2>Map view</h2>

            <span>
              {loading
                ? "Searching nearby places..."
                : mapPlaces.length
                ? `${mapPlaces.length} place${
                    mapPlaces.length === 1
                      ? ""
                      : "s"
                  } shown`
                : "No places with map coordinates found nearby"}
            </span>
          </div>

          <MapPin
            size={20}
            aria-hidden="true"
          />
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

          {/* Existing Safe Places Markers */}
          {mapPlaces.map((place) => (
            <Marker
              key={place.id}
              position={place.coordinates}
              icon={createMarkerIcon(
                place.category
              )}
              eventHandlers={{
                click: () =>
                  setSelectedId(place.id),
              }}
            >
              <Popup>
                <div className="safe-map-popup">
                  <strong>
                    {place.name}
                  </strong>

                  {place.address && (
                    <span>
                      {place.address}
                    </span>
                  )}

                  <a
                    href={getDirectionsUrl(
                      place
                    )}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Navigation size={14} />
                    Navigate
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Police Risk Markers */}
          {ENABLE_RISK_PREVIEW &&
            showPoliceRisks &&
            policeRisks.map((report) => {
              const [
                longitude,
                latitude,
              ] = report.geo.coordinates;

              return (
                <Marker
                  key={`police-risk-${report._id}`}
                  position={[
                    latitude,
                    longitude,
                  ]}
                  icon={
                    riskIcons[
                      report.policeRiskLevel
                    ]
                  }
                >
                  <Popup>
                    <div
                      style={{
                        minWidth: "180px",
                      }}
                    >
                      <strong>
                        {report.incidentType}
                      </strong>

                      <p>
                        <strong>
                          Location:
                        </strong>{" "}
                        {report.location}
                      </p>

                      <p>
                        <strong>
                          Risk Level:
                        </strong>{" "}
                        {report.policeRiskLevel.toUpperCase()}
                      </p>

                      {report.policeRiskReason && (
                        <p>
                          <strong>
                            Reason:
                          </strong>{" "}
                          {
                            report.policeRiskReason
                          }
                        </p>
                      )}

                      <small>
                        Police-verified
                        incident assessment
                        — development preview
                      </small>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

          {/* User Location Marker */}
          {userLocation && (
            <Marker
              position={userLocation}
              icon={L.divIcon({
                className:
                  "user-location-wrap",
                html:
                  '<span class="user-location-dot"></span>',
                iconSize: [20, 20],
                iconAnchor: [10, 10],
              })}
            />
          )}
        </MapContainer>
      </section>

      <section
        className="safe-directory-list"
        aria-live="polite"
      >
        <div className="safe-list-title">
          <div>
            <h2>Directory</h2>

            <span>
              {loading
                ? "Loading places..."
                : `${
                    filteredPlaces.length
                  } place${
                    filteredPlaces.length === 1
                      ? ""
                      : "s"
                  }`}
            </span>
          </div>
        </div>

        {loadError && (
          <div
            className="safe-empty"
            role="status"
          >
            <MapPin size={24} />

            <strong>
              Places unavailable
            </strong>

            <p>{loadError}</p>
          </div>
        )}

        {!loading &&
          !loadError &&
          filteredPlaces.length === 0 && (
            <div
              className="safe-empty"
              role="status"
            >
              <MapPin size={24} />

              <strong>
                No places found
              </strong>

              <p>
                Try another area or
                choose a different
                category.
              </p>
            </div>
          )}

        <div className="safe-place-cards">
          {filteredPlaces.map((place) => {
            const distance = getDistanceKm(
              userLocation ||
                (locationLabel
                  ? mapCenter
                  : null),
              place.coordinates
            );

            const PlaceIcon =
              place.category === "hospital"
                ? Hospital
                : place.category ===
                  "fire-station"
                ? Flame
                : Building2;

            return (
              <article
                className={`safe-place-card ${
                  selectedId === place.id
                    ? "selected"
                    : ""
                }`}
                key={place.id}
                onClick={() =>
                  setSelectedId(place.id)
                }
              >
                <div
                  className={`safe-place-type safe-place-type-${place.category}`}
                >
                  <PlaceIcon
                    size={21}
                    aria-hidden="true"
                  />
                </div>

                <div className="safe-place-info">
                  <span className="safe-place-category">
                    {place.category}
                  </span>

                  <h3>{place.name}</h3>

                  {place.address && (
                    <p>
                      {place.address}
                    </p>
                  )}

                  {distance !== null && (
                    <small>
                      {distance.toFixed(1)} km
                      away
                    </small>
                  )}
                </div>

                <a
                  className="safe-directions"
                  href={getDirectionsUrl(
                    place
                  )}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Navigate to ${place.name}`}
                  onClick={(event) =>
                    event.stopPropagation()
                  }
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
