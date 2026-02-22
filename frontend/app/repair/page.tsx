import RepairAssistant from "../components/RepairAssistant";

export default function RepairPage() {
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
        gap: "0.9rem",
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
        REPAIR
      </h1>
      <p
        style={{
          fontSize: "1rem",
          color: "var(--muted)",
          maxWidth: "700px",
          lineHeight: 1.6,
        }}
      >
        Live video help
      </p>
      <RepairAssistant />
    </main>
  );
}
