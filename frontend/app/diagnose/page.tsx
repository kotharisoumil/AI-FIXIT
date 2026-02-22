export default function DiagnosePage() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 120px)",
        fontFamily: "'Outfit', monospace",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontSize: "clamp(2rem, 5vw, 3.5rem)",
          fontWeight: 700,
          color: "var(--foreground)",
          marginBottom: "1rem",
        }}
      >
        DIAGNOSE
      </h1>
      <p
        style={{
          fontSize: "1.1rem",
          color: "var(--muted)",
          maxWidth: "500px",
          lineHeight: 1.6,
        }}
      >
        Describe your device issue and let AI-FIXIT identify the root cause.
      </p>
    </main>
  );
}
