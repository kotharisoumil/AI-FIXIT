"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Mode = "dispose" | "contractors";

type PlaceResult = {
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
};

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

function loadGoogleMapsScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!GOOGLE_MAPS_API_KEY) {
      reject(new Error("Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"));
      return;
    }
    if (typeof google !== "undefined" && google.maps) {
      resolve();
      return;
    }
    if (document.getElementById("google-maps-script")) {
      const interval = setInterval(() => {
        if (typeof google !== "undefined" && google.maps) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
      return;
    }
    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps script"));
    document.head.appendChild(script);
  });
}

export default function RecommendationsMap() {
  const [mode, setMode] = useState<Mode>("dispose");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState("Waiting for your location permission...");
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const mapsReady = useRef(false);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus("Geolocation is unavailable in this browser.");
      setUserLocation(null);
      setPlaces([]);
      setIsLoading(false);
      setError("Location access is required to show nearby recommendations.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus("Using your current location.");
        setError("");
      },
      () => {
        setLocationStatus("Location permission denied.");
        setUserLocation(null);
        setPlaces([]);
        setIsLoading(false);
        setError("Enable location permission to load recommendations near you.");
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      requestLocation();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [requestLocation]);

  useEffect(() => {
    loadGoogleMapsScript()
      .then(() => {
        mapsReady.current = true;
        if (mapRef.current && userLocation && !mapInstanceRef.current) {
          mapInstanceRef.current = new google.maps.Map(mapRef.current, {
            center: userLocation,
            zoom: 11,
            styles: [
              { elementType: "geometry", stylers: [{ color: "#1d1d1d" }] },
              { elementType: "labels.text.fill", stylers: [{ color: "#999" }] },
              { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a1a" }] },
              { featureType: "road", elementType: "geometry", stylers: [{ color: "#333" }] },
              { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e0e0e" }] },
            ],
          });
        }
      })
      .catch(() => setError("Could not load Google Maps."));
  }, [userLocation]);

  useEffect(() => {
    if (mapRef.current && mapsReady.current && userLocation && !mapInstanceRef.current) {
      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        center: userLocation,
        zoom: 11,
        styles: [
          { elementType: "geometry", stylers: [{ color: "#1d1d1d" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#999" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a1a" }] },
          { featureType: "road", elementType: "geometry", stylers: [{ color: "#333" }] },
          { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e0e0e" }] },
        ],
      });
    }

    if (mapInstanceRef.current && userLocation) {
      mapInstanceRef.current.setCenter(userLocation);
    }
  }, [userLocation]);

  const clearMarkers = () => {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
  };

  const searchPlaces = useCallback(() => {
    if (!mapsReady.current || !mapInstanceRef.current || !userLocation) return;

    setIsLoading(true);
    setError("");
    setPlaces([]);
    clearMarkers();

    const service = new google.maps.places.PlacesService(mapInstanceRef.current);
    const keyword =
      mode === "dispose"
        ? "electronics recycling e-waste disposal"
        : "electronics repair contractor";

    service.nearbySearch(
      {
        location: userLocation,
        radius: 25000,
        keyword,
      },
      (results, status) => {
        setIsLoading(false);

        if (status !== google.maps.places.PlacesServiceStatus.OK || !results) {
          if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            setPlaces([]);
            return;
          }
          setError(`Places search failed (${status})`);
          return;
        }

        const normalized: PlaceResult[] = results.map((r) => ({
          name: r.name || "Unknown",
          address: r.vicinity || "Address unavailable",
          lat: r.geometry?.location?.lat() ?? 0,
          lng: r.geometry?.location?.lng() ?? 0,
          rating: r.rating,
        }));

        setPlaces(normalized);

        const infoWindow = new google.maps.InfoWindow();

        results.forEach((r) => {
          if (!r.geometry?.location) return;
          const marker = new google.maps.Marker({
            position: r.geometry.location,
            map: mapInstanceRef.current!,
            title: r.name,
          });
          marker.addListener("click", () => {
            infoWindow.setContent(
              `<div style="color:#000;font-family:Outfit,monospace;font-size:13px"><strong>${r.name}</strong><br/>${r.vicinity || ""}<br/>${r.rating ? "⭐ " + r.rating : ""}</div>`
            );
            infoWindow.open(mapInstanceRef.current!, marker);
          });
          markersRef.current.push(marker);
        });
      }
    );
  }, [mode, userLocation]);

  useEffect(() => {
    if (!userLocation) {
      return;
    }

    if (mapsReady.current && mapInstanceRef.current) {
      const timeoutId = window.setTimeout(() => {
        searchPlaces();
      }, 0);
      return () => window.clearTimeout(timeoutId);
    } else {
      const interval = setInterval(() => {
        if (mapsReady.current && mapInstanceRef.current) {
          clearInterval(interval);
          searchPlaces();
        }
      }, 300);
      return () => clearInterval(interval);
    }
  }, [searchPlaces, userLocation]);

  return (
    <section
      style={{
        width: "100%",
        maxWidth: "1100px",
        display: "grid",
        gap: "0.85rem",
        fontFamily: "'Outfit', monospace",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "0.55rem",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={() => setMode("dispose")}
          style={{
            border: "none",
            background: mode === "dispose" ? "var(--accent)" : "transparent",
            color: mode === "dispose" ? "#0a0a0a" : "var(--muted)",
            fontFamily: "'Outfit', monospace",
            fontSize: "0.83rem",
            letterSpacing: "0.1em",
            fontWeight: 600,
            padding: "0.5rem 0.85rem",
            cursor: "pointer",
          }}
        >
          Dispose
        </button>
        <button
          type="button"
          onClick={() => setMode("contractors")}
          style={{
            border: "none",
            background: mode === "contractors" ? "var(--accent)" : "transparent",
            color: mode === "contractors" ? "#0a0a0a" : "var(--muted)",
            fontFamily: "'Outfit', monospace",
            fontSize: "0.83rem",
            letterSpacing: "0.1em",
            fontWeight: 600,
            padding: "0.5rem 0.85rem",
            cursor: "pointer",
          }}
        >
          Contractors
        </button>
        <button
          type="button"
          onClick={requestLocation}
          style={{
            border: "none",
            background: "var(--foreground)",
            color: "var(--background)",
            fontFamily: "'Outfit', monospace",
            fontSize: "0.8rem",
            letterSpacing: "0.08em",
            fontWeight: 600,
            padding: "0.5rem 0.85rem",
            cursor: "pointer",
          }}
        >
          USE MY LOCATION
        </button>
      </div>

      <p style={{ fontSize: "0.84rem", color: "var(--muted)", textAlign: "center" }}>
        {locationStatus}
      </p>

      <div
        ref={mapRef}
        style={{
          border: "1px solid rgba(128,128,128,0.35)",
          width: "100%",
          height: "560px",
        }}
      />

      <section
        style={{
          border: "1px solid rgba(128,128,128,0.35)",
          padding: "0.8rem",
          display: "grid",
          gap: "0.6rem",
          textAlign: "left",
        }}
      >
        <h3 style={{ fontSize: "0.95rem", letterSpacing: "0.08em" }}>
          {mode === "dispose" ? "Safe e-waste disposal locations" : "Nearby contractors"}
        </h3>
        {!userLocation && (
          <p style={{ color: "var(--muted)", fontSize: "0.84rem" }}>
            Allow location access, then press USE MY LOCATION to load nearby results.
          </p>
        )}
        {isLoading && <p style={{ color: "var(--muted)", fontSize: "0.84rem" }}>Loading...</p>}
        {error && (
          <p style={{ color: "#f87171", fontSize: "0.84rem" }}>
            Could not load recommendations: {error}
          </p>
        )}
        {!isLoading && !error && places.length === 0 && (
          <p style={{ color: "var(--muted)", fontSize: "0.84rem" }}>
            No matching places found for this area.
          </p>
        )}
        {!isLoading &&
          !error &&
          places.map((place, i) => (
            <article
              key={`${place.name}-${i}`}
              style={{
                borderTop: "1px solid rgba(128,128,128,0.25)",
                paddingTop: "0.55rem",
                display: "grid",
                gap: "0.2rem",
              }}
            >
              <p style={{ fontSize: "0.9rem", color: "var(--foreground)" }}>{place.name}</p>
              <p style={{ fontSize: "0.82rem", color: "var(--muted)" }}>{place.address}</p>
              {typeof place.rating === "number" && (
                <p style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Rating: {place.rating}</p>
              )}
            </article>
          ))}
      </section>
    </section>
  );
}
