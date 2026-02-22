"use client";

import { useMemo, useState } from "react";

type Mode = "dispose" | "contractors";

export default function RecommendationsMap() {
  const [mode, setMode] = useState<Mode>("dispose");

  const mapSrc = useMemo(() => {
    if (mode === "dispose") {
      return "https://maps.google.com/maps?q=e-waste%20recycling%20near%20UNC%20Pembroke%20North%20Carolina&t=&z=12&ie=UTF8&iwloc=&output=embed";
    }

    return "https://maps.google.com/maps?q=contractors%20near%20UNC%20Pembroke%20North%20Carolina&t=&z=12&ie=UTF8&iwloc=&output=embed";
  }, [mode]);

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
      </div>

      <p style={{ fontSize: "0.84rem", color: "var(--muted)", textAlign: "center" }}>
        Showing results near UNC Pembroke, North Carolina, USA.
      </p>

      <div style={{ border: "1px solid rgba(128,128,128,0.35)", width: "100%", height: "560px" }}>
        <iframe
          title={mode === "dispose" ? "Dispose locations map" : "Contractors map"}
          src={mapSrc}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
    </section>
  );
}
