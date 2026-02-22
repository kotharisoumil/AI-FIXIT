"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useRef } from "react";

type DiagnosisSummary = {
  title: string;
  effort: "Low" | "Med" | "High";
  risk: "Safe" | "Caution" | "Dangerous";
};

export default function DiagnoseAssistant() {
  const router = useRouter();
  const [imageName, setImageName] = useState<string>("");
  const [context, setContext] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);
  const [summary, setSummary] = useState<DiagnosisSummary | null>(null);
  const [fullReport, setFullReport] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseDiagnosisReport = (report: string) => {
    // Parse the structured report from the backend
    const titleMatch = report.match(/Title:\s*(.+?)(?=\n|Effort:)/);
    const effortMatch = report.match(/Effort:\s*(Low|Med|High)/);
    const riskMatch = report.match(/Risk:\s*(Safe|Caution|Dangerous)/);
    const reportMatch = report.match(/Report:\s*([\s\S]+?)(?=\n\n|$)/);

    return {
      title: titleMatch ? titleMatch[1].trim() : "Diagnosis",
      effort: (effortMatch ? effortMatch[1] : "Med") as "Low" | "Med" | "High",
      risk: (riskMatch ? riskMatch[1] : "Caution") as "Safe" | "Caution" | "Dangerous",
      report: reportMatch ? reportMatch[1].trim() : report,
    };
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const file = fileInputRef.current?.files?.[0];
      if (!file) {
        setError("Please select an image.");
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("image", file);
      formData.append("context", context);

      const response = await fetch("http://localhost:8000/diagnose", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to diagnose: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        const parsed = parseDiagnosisReport(data.diagnosis);
        setSummary({
          title: parsed.title,
          effort: parsed.effort,
          risk: parsed.risk,
        });
        setFullReport(parsed.report);
        setSubmitted(true);
      } else {
        setError(data.error || "Failed to generate diagnosis.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setLoading(false);
    }
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
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(event) => setImageName(event.target.files?.[0]?.name ?? "")}
            style={{ display: "none" }}
          />
        </label>

        {imageName && (
          <p style={{ fontSize: "0.82rem", color: "var(--muted)" }}>Selected image: {imageName}</p>
        )}

        <textarea
          value={context}
          onChange={(event) => setContext(event.target.value)}
          required
          placeholder="Describe your device issue and what you need help with..."
          style={{
            width: "min(760px, 97%)",
            border: "1px solid rgba(128,128,128,0.4)",
            borderRadius: "0.5rem",
            background: "transparent",
            color: "var(--foreground)",
            padding: "0.86rem 1.15rem",
            fontFamily: "'Outfit', monospace",
            fontSize: "0.9rem",
            outline: "none",
            minHeight: "80px",
            resize: "vertical",
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "fit-content",
            border: "none",
            background: loading ? "var(--muted)" : "var(--accent)",
            color: "#0a0a0a",
            padding: "0.55rem 0.9rem",
            fontSize: "0.84rem",
            letterSpacing: "0.08em",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "'Outfit', monospace",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "ANALYZING..." : "GENERATE REPORT"}
        </button>
      </form>

      {error && (
        <div
          style={{
            width: "min(760px, 97%)",
            justifySelf: "center",
            color: "#ff6b6b",
            fontSize: "0.9rem",
            padding: "0.75rem",
            border: "1px solid #ff6b6b",
            borderRadius: "0.25rem",
            textAlign: "left",
          }}
        >
          Error: {error}
        </div>
      )}

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
              Title: &ldquo;{summary.title}&rdquo;
            </p>
            <p style={{ fontSize: "0.86rem", color: "var(--muted)" }}>Effort: {summary.effort}</p>
            <p style={{ fontSize: "0.86rem", color: "var(--muted)" }}>Risk: {summary.risk}</p>
          </div>
          <p style={{ fontSize: "0.9rem", color: "var(--foreground)", lineHeight: 1.55 }}>
            {fullReport}
          </p>

          {(() => {
            const tooRisky =
              (summary.risk === "Caution" || summary.risk === "Dangerous") &&
              summary.effort === "High";

            return (
              <button
                type="button"
                onClick={() => router.push(tooRisky ? "/dispose" : "/repair")}
                style={{
                  marginTop: "0.6rem",
                  border: "none",
                  background: tooRisky ? "#f87171" : "var(--accent)",
                  color: "#0a0a0a",
                  padding: "0.6rem 1rem",
                  fontSize: "0.84rem",
                  letterSpacing: "0.08em",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "'Outfit', monospace",
                  width: "fit-content",
                }}
              >
                {tooRisky ? "VIEW RECOMMENDATIONS" : "START REPAIR"}
              </button>
            );
          })()}
        </section>
      )}
    </div>
  );
}
