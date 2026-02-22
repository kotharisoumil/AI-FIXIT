"use client";

import { useEffect, useState } from "react";

const SESSION_STORAGE_KEY = "ai_fixit_auth_session";

type Session = {
  email: string;
  name: string;
};

export default function ProfileIcon() {
  const [session, setSession] = useState<Session | null>(null);
  const [hovered, setHovered] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setSession(null);
    setHovered(false);
  };

  useEffect(() => {
    const check = () => {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      if (raw) {
        try {
          setSession(JSON.parse(raw) as Session);
        } catch {
          setSession(null);
        }
      } else {
        setSession(null);
      }
    };

    check();

    const onStorage = (e: StorageEvent) => {
      if (e.key === SESSION_STORAGE_KEY) check();
    };
    window.addEventListener("storage", onStorage);

    const interval = setInterval(check, 1000);

    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(interval);
    };
  }, []);

  if (!session) return null;

  const initials = session.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        cursor: "default",
      }}
    >
      <div
        style={{
          width: "2rem",
          height: "2rem",
          borderRadius: "50%",
          background: "var(--accent)",
          color: "#0a0a0a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Outfit', monospace",
          fontSize: "0.78rem",
          fontWeight: 700,
          letterSpacing: "0.04em",
          flexShrink: 0,
        }}
      >
        {initials}
      </div>

      {hovered && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: "0.4rem",
            background: "var(--background)",
            border: "1px solid rgba(128,128,128,0.3)",
            padding: "0.55rem 0.75rem",
            whiteSpace: "nowrap",
            display: "grid",
            gap: "0.5rem",
            zIndex: 30,
            fontFamily: "'Outfit', monospace",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                width: "1.6rem",
                height: "1.6rem",
                borderRadius: "50%",
                background: "var(--accent)",
                color: "#0a0a0a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.68rem",
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <span style={{ fontSize: "0.84rem", color: "var(--foreground)" }}>
              {session.name}
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            style={{
              border: "1px solid rgba(128,128,128,0.35)",
              background: "transparent",
              color: "var(--muted)",
              padding: "0.35rem 0.55rem",
              fontSize: "0.74rem",
              letterSpacing: "0.08em",
              fontFamily: "'Outfit', monospace",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            LOG OUT
          </button>
        </div>
      )}
    </div>
  );
}
