"use client";

import { FormEvent, useState } from "react";

type ActionSummary = {
  title: string;
  effort: "Low" | "Med" | "High";
  risk: "Safe" | "Caution";
};

export default function DisposeAssistant() {
  const [imageName, setImageName] = useState<string>("");
  const [prompt, setPrompt] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);
  const [summary, setSummary] = useState<ActionSummary | null>(null);
  const [fullReport, setFullReport] = useState("");

  const generatePlaceholder = () => {
    const hasBattery = /battery|drain|overheat|hot/i.test(prompt);

    const action: ActionSummary = hasBattery
      ? { title: "Reduce background drain", effort: "Low", risk: "Safe" }
      : { title: "Stabilize performance settings", effort: "Med", risk: "Caution" };

    const report = hasBattery
      ? "Full report: The symptom pattern indicates likely background power draw and inefficient charging behavior rather than immediate hardware failure. Start with low-effort configuration changes that reduce background activity, screen intensity, and unnecessary connectivity polling. Reassess battery temperature and discharge trend over the next 2–3 charging cycles. If drain remains abnormal after those changes, proceed with battery-health diagnostics before considering replacement."
      : "Full report: The issue appears to involve mixed software load and possible resource contention. Begin with medium-effort system cleanup steps, verify update status, and remove high-impact startup/background tasks. Monitor responsiveness and thermal behavior after each change to isolate cause-effect. Escalate to deeper maintenance only if stability does not improve after baseline optimization."
      ;

    setSummary(action);
    setFullReport(report);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    generatePlaceholder();
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "860px",
        display: "grid",
        gap: "1rem",
        textAlign: "center",
        fontFamily: "'Outfit', monospace",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gap: "0.95rem",
          justifyItems: "center",
        }}
      >
        <label
          style={{
            width: "min(680px, 95%)",
            border: "1px dashed rgba(128,128,128,0.5)",
            padding: "1.4rem 1rem",
            display: "grid",
            gap: "0.45rem",
            justifyItems: "center",
            cursor: "pointer",
          }}
        >
          <span style={{ fontSize: "1.35rem", color: "var(--accent)", lineHeight: 1 }}>⤴</span>
          <span style={{ fontSize: "0.92rem", color: "var(--foreground)", letterSpacing: "0.04em" }}>
            Upload Image
          </span>
          <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
            Click to choose a device photo
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setImageName(event.target.files?.[0]?.name ?? "")}
            style={{ display: "none" }}
          />
        </label>

        {imageName && (
          <p style={{ fontSize: "0.82rem", color: "var(--muted)" }}>Selected image: {imageName}</p>
        )}

        <input
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          required
          placeholder="Describe your device issue and what you need help with..."
          style={{
            width: "min(760px, 97%)",
            border: "1px solid rgba(128,128,128,0.4)",
            borderRadius: "999px",
            background: "transparent",
            color: "var(--foreground)",
            padding: "0.86rem 1.15rem",
            fontFamily: "'Outfit', monospace",
            fontSize: "0.9rem",
            outline: "none",
          }}
        />

        <button
          type="submit"
          style={{
            width: "fit-content",
            border: "none",
            background: "var(--accent)",
            color: "#0a0a0a",
            padding: "0.55rem 0.9rem",
            fontSize: "0.84rem",
            letterSpacing: "0.08em",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "'Outfit', monospace",
          }}
        >
          GENERATE REPORT
        </button>
      </form>

      {submitted && summary && (
        <section
          style={{
            marginTop: "0.65rem",
            width: "min(760px, 97%)",
            justifySelf: "center",
            textAlign: "left",
            border: "1px solid rgba(128,128,128,0.35)",
            padding: "1rem",
            display: "grid",
            gap: "0.6rem",
          }}
        >
          <h2 style={{ fontSize: "1rem", letterSpacing: "0.06em" }}>DIAGNOSTIC REPORT</h2>
          <div
            style={{
              display: "grid",
              gap: "0.3rem",
            }}
          >
            <p style={{ fontSize: "0.9rem", color: "var(--foreground)" }}>
              Title: “{summary.title}”
            </p>
            <p style={{ fontSize: "0.86rem", color: "var(--muted)" }}>Effort: {summary.effort}</p>
            <p style={{ fontSize: "0.86rem", color: "var(--muted)" }}>Risk: {summary.risk}</p>
          </div>
          <p style={{ fontSize: "0.9rem", color: "var(--foreground)", lineHeight: 1.55 }}>
            {fullReport}
          </p>
        </section>
      )}
    </div>
  );
}
