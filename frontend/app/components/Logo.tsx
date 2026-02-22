import Link from "next/link";

export default function Logo() {
  return (
    <Link
      href="/"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.45rem",
        textDecoration: "none",
        color: "var(--foreground)",
        fontFamily: "'Outfit', monospace",
      }}
      aria-label="AI-FIXIT home"
    >
      <span
        aria-hidden="true"
        style={{
          fontSize: "1rem",
          color: "var(--accent)",
          lineHeight: 1,
        }}
      >
        ♻
      </span>
      <span
        style={{
          fontSize: "0.82rem",
          fontWeight: 600,
          letterSpacing: "0.12em",
        }}
      >
        AI-FIXIT
      </span>
    </Link>
  );
}
