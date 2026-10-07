import React, { useMemo, useState } from "react";

const SafePlaces = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedPlace, setSelectedPlace] = useState(null);

  // Demo data until Safe Places backend API is available
  const safePlaces = [
    {
      id: 1,
      name: "Dhanmondi Police Station",
      category: "Police",
      address: "Dhanmondi, Dhaka",
      latitude: 23.7465,
      longitude: 90.376,
      phone: "999",
    },
    {
      id: 2,
      name: "Popular Medical College Hospital",
      category: "Hospital",
      address: "Dhanmondi, Dhaka",
      latitude: 23.738,
      longitude: 90.372,
      phone: "09613-787800",
    },
    {
      id: 3,
      name: "Mohammadpur Fire Station",
      category: "Fire Station",
      address: "Mohammadpur, Dhaka",
      latitude: 23.758,
      longitude: 90.358,
      phone: "16163",
    },
    {
      id: 4,
      name: "Square Hospital",
      category: "Hospital",
      address: "Panthapath, Dhaka",
      latitude: 23.752,
      longitude: 90.381,
      phone: "10616",
    },
  ];

  const categories = ["All", "Police", "Hospital", "Fire Station"];

  const filteredPlaces = useMemo(() => {
    return safePlaces.filter((place) => {
      const matchesCategory =
        category === "All" || place.category === category;

      const search = searchTerm.toLowerCase();

      const matchesSearch =
        place.name.toLowerCase().includes(search) ||
        place.address.toLowerCase().includes(search);

      return matchesCategory && matchesSearch;
    });
  }, [searchTerm, category]);

  const navigateToPlace = (place) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const viewOnMap = (place) => {
    setSelectedPlace(place);

    setTimeout(() => {
      document
        .getElementById("safe-place-map")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  };

  const getMarkerPosition = (place) => {
    const positions = {
      1: { top: "25%", left: "30%" },
      2: { top: "55%", left: "42%" },
      3: { top: "35%", left: "68%" },
      4: { top: "68%", left: "72%" },
    };

    return positions[place.id] || { top: "50%", left: "50%" };
  };

  return (
    <div
      style={{
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ marginBottom: "8px" }}>Safe Places Directory</h1>

      <p style={{ color: "#666", marginBottom: "25px" }}>
        Browse nearby safe places, view their locations, and start navigation
        with one tap.
      </p>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by place name or location..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "13px 15px",
          border: "1px solid #d1d5db",
          borderRadius: "8px",
          fontSize: "15px",
          marginBottom: "15px",
        }}
      />

      {/* Category filters */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "25px",
        }}
      >
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            style={{
              padding: "9px 16px",
              borderRadius: "20px",
              border:
                category === item
                  ? "1px solid #2563eb"
                  : "1px solid #d1d5db",
              backgroundColor:
                category === item ? "#2563eb" : "#ffffff",
              color: category === item ? "#ffffff" : "#333333",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            {item}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "18px",
          marginBottom: "35px",
        }}
      >
        {filteredPlaces.map((place) => (
          <div
            key={place.id}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "20px",
              backgroundColor: "#ffffff",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
            }}
          >
            <span
              style={{
                display: "inline-block",
                backgroundColor: "#eff6ff",
                color: "#1d4ed8",
                padding: "5px 10px",
                borderRadius: "15px",
                fontSize: "12px",
                fontWeight: "bold",
                marginBottom: "10px",
              }}
            >
              {place.category}
            </span>

            <h2
              style={{
                fontSize: "19px",
                marginTop: "5px",
                marginBottom: "8px",
              }}
            >
              {place.name}
            </h2>

            <p style={{ color: "#555", margin: "6px 0" }}>
              {place.address}
            </p>

            <p style={{ color: "#555", margin: "6px 0 18px" }}>
              Phone: {place.phone}
            </p>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <button
                type="button"
                onClick={() => viewOnMap(place)}
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "1px solid #2563eb",
                  backgroundColor: "#ffffff",
                  color: "#2563eb",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                View on Map
              </button>

              <button
                type="button"
                onClick={() => navigateToPlace(place)}
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Navigate
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredPlaces.length === 0 && (
        <p
          style={{
            textAlign: "center",
            padding: "25px",
            color: "#666",
          }}
        >
          No safe places found.
        </p>
      )}

      {/* Map preview */}
      <div
        id="safe-place-map"
        style={{
          marginTop: "20px",
        }}
      >
        <h2>Map</h2>

        <p style={{ color: "#666" }}>
          Select a marker or choose "View on Map" from the directory.
        </p>

        <div
          style={{
            height: "380px",
            position: "relative",
            overflow: "hidden",
            borderRadius: "14px",
            border: "1px solid #d1d5db",
            background:
              "linear-gradient(135deg, #eef6ee 0%, #f8fafc 45%, #e6f0f8 100%)",
          }}
        >
          {/* Simple roads for map-style visualization */}
          <div
            style={{
              position: "absolute",
              width: "120%",
              height: "12px",
              backgroundColor: "#ffffff",
              top: "48%",
              left: "-10%",
              transform: "rotate(-8deg)",
            }}
          />

          <div
            style={{
              position: "absolute",
              width: "12px",
              height: "120%",
              backgroundColor: "#ffffff",
              left: "52%",
              top: "-10%",
              transform: "rotate(12deg)",
            }}
          />

          {filteredPlaces.map((place) => {
            const position = getMarkerPosition(place);
            const selected = selectedPlace?.id === place.id;

            return (
              <button
                key={place.id}
                type="button"
                title={place.name}
                onClick={() => setSelectedPlace(place)}
                style={{
                  position: "absolute",
                  top: position.top,
                  left: position.left,
                  transform: "translate(-50%, -50%)",
                  width: selected ? "46px" : "38px",
                  height: selected ? "46px" : "38px",
                  borderRadius: "50%",
                  border: selected
                    ? "4px solid #1e3a8a"
                    : "3px solid #ffffff",
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontWeight: "bold",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                }}
              >
                📍
              </button>
            );
          })}
        </div>

        {selectedPlace && (
          <div
            style={{
              marginTop: "15px",
              padding: "16px",
              borderRadius: "10px",
              backgroundColor: "#eff6ff",
            }}
          >
            <strong>{selectedPlace.name}</strong>

            <p style={{ margin: "6px 0" }}>
              {selectedPlace.address}
            </p>

            <button
              type="button"
              onClick={() => navigateToPlace(selectedPlace)}
              style={{
                padding: "9px 14px",
                border: "none",
                borderRadius: "7px",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Navigate
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SafePlaces;