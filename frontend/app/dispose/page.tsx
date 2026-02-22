import RecommendationsMap from "../components/RecommendationsMap";

export default function RecommendationsPage() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        minHeight: "calc(100vh - 120px)",
        fontFamily: "'Outfit', monospace",
        padding: "2rem",
        textAlign: "center",
        gap: "0.7rem",
      }}
    >
      <h1
        style={{
          fontSize: "clamp(2rem, 5vw, 3.5rem)",
          fontWeight: 700,
          color: "var(--foreground)",
          marginBottom: "0.2rem",
        }}
      >
        RECOMMENDATIONS
      </h1>
      <RecommendationsMap />
    </main>
  );
}
