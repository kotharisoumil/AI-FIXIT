"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

type Mode = "login" | "signup";

type MockUser = {
  name: string;
  email: string;
  password: string;
};

const USERS_STORAGE_KEY = "ai_fixit_mock_users";
const SESSION_STORAGE_KEY = "ai_fixit_auth_session";

export default function AuthControls() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitError, setSubmitError] = useState("");

  const isSignup = useMemo(() => mode === "signup", [mode]);

  const closeModal = () => {
    setMode(null);
    setEmail("");
    setPassword("");
    setName("");
    setSubmitError("");
  };

  const readUsers = (): MockUser[] => {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as MockUser[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const writeUsers = (users: MockUser[]) => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    const users = readUsers();

    if (isSignup) {
      const existing = users.find((user) => user.email === normalizedEmail);
      if (existing) {
        setSubmitError("An account with this email already exists.");
        return;
      }

      const newUser: MockUser = {
        name: name.trim(),
        email: normalizedEmail,
        password,
      };

      writeUsers([...users, newUser]);
      localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({ email: newUser.email, name: newUser.name })
      );
      closeModal();
      router.push("/diagnose");
      return;
    }

    const matchedUser = users.find(
      (user) => user.email === normalizedEmail && user.password === password
    );

    if (!matchedUser) {
      setSubmitError("Invalid email or password.");
      return;
    }

    localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ email: matchedUser.email, name: matchedUser.name })
    );
    closeModal();
    router.push("/diagnose");
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

            {submitError && (
              <p style={{ color: "#f87171", fontSize: "0.84rem" }}>{submitError}</p>
            )}

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
