"use client";

import { FormEvent, useMemo, useState } from "react";

type Mode = "login" | "signup";

export default function AuthControls() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const isSignup = useMemo(() => mode === "signup", [mode]);

  const closeModal = () => {
    setMode(null);
    setEmail("");
    setPassword("");
    setName("");
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    closeModal();
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          gap: "0.8rem",
          marginTop: "1.1rem",
        }}
      >
        <button
          type="button"
          onClick={() => setMode("login")}
          style={{
            border: "none",
            background: "var(--foreground)",
            color: "var(--background)",
            fontFamily: "'Outfit', monospace",
            fontSize: "0.86rem",
            letterSpacing: "0.1em",
            padding: "0.6rem 1.1rem",
            cursor: "pointer",
          }}
        >
          LOGIN
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          style={{
            border: "none",
            background: "var(--accent)",
            color: "#0a0a0a",
            fontFamily: "'Outfit', monospace",
            fontSize: "0.86rem",
            letterSpacing: "0.1em",
            padding: "0.6rem 1.1rem",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          SIGNUP
        </button>
      </div>

      {mode && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={isSignup ? "Sign up form" : "Login form"}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            zIndex: 50,
          }}
          onClick={closeModal}
        >
          <form
            onSubmit={onSubmit}
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "400px",
              background: "var(--background)",
              color: "var(--foreground)",
              padding: "1.25rem",
              border: "1px solid rgba(128,128,128,0.25)",
              display: "flex",
              flexDirection: "column",
              gap: "0.8rem",
              fontFamily: "'Outfit', monospace",
            }}
          >
            <h2
              style={{
                fontSize: "1.05rem",
                letterSpacing: "0.08em",
                marginBottom: "0.2rem",
              }}
            >
              {isSignup ? "CREATE ACCOUNT" : "LOGIN"}
            </h2>

            {isSignup && (
              <label style={{ display: "grid", gap: "0.35rem", fontSize: "0.88rem" }}>
                Full Name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  placeholder="Your name"
                  style={{
                    background: "transparent",
                    color: "var(--foreground)",
                    border: "1px solid rgba(128,128,128,0.35)",
                    padding: "0.55rem",
                    fontFamily: "'Outfit', monospace",
                  }}
                />
              </label>
            )}

            <label style={{ display: "grid", gap: "0.35rem", fontSize: "0.88rem" }}>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="you@example.com"
                style={{
                  background: "transparent",
                  color: "var(--foreground)",
                  border: "1px solid rgba(128,128,128,0.35)",
                  padding: "0.55rem",
                  fontFamily: "'Outfit', monospace",
                }}
              />
            </label>

            <label style={{ display: "grid", gap: "0.35rem", fontSize: "0.88rem" }}>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                style={{
                  background: "transparent",
                  color: "var(--foreground)",
                  border: "1px solid rgba(128,128,128,0.35)",
                  padding: "0.55rem",
                  fontFamily: "'Outfit', monospace",
                }}
              />
            </label>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem", marginTop: "0.2rem" }}>
              <button
                type="button"
                onClick={closeModal}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "var(--muted)",
                  cursor: "pointer",
                  fontFamily: "'Outfit', monospace",
                  fontSize: "0.82rem",
                  letterSpacing: "0.1em",
                  padding: "0.45rem 0.7rem",
                }}
              >
                CANCEL
              </button>
              <button
                type="submit"
                style={{
                  border: "none",
                  background: "var(--accent)",
                  color: "#0a0a0a",
                  cursor: "pointer",
                  fontFamily: "'Outfit', monospace",
                  fontSize: "0.82rem",
                  letterSpacing: "0.1em",
                  fontWeight: 700,
                  padding: "0.45rem 0.8rem",
                }}
              >
                {isSignup ? "CREATE" : "LOGIN"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
