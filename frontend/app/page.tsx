import TypingText from "./components/TypingText";
import AuthControls from "./components/AuthControls";

export default function Home() {
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
          fontSize: "clamp(3rem, 8vw, 6rem)",
          fontWeight: 500,
          letterSpacing: "-0.02em",
          color: "var(--foreground)",
          lineHeight: 1.1,
          marginBottom: "1.2rem",
        }}
      >
        AI-FIXIT
      </h1>
      <div style={{ minHeight: "2rem" }}>
        <TypingText />
      </div>
      <AuthControls />
    </main>
  );
}
