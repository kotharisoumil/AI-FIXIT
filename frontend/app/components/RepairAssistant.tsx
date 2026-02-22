"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type RepairStep = {
  id: number;
  instruction: string;
  target_object: string;
  action: string;
  image_reference?: string | null;
};

type CurrentStepResponse = {
  completed: boolean;
  step?: RepairStep;
  total_steps?: number;
  current_index?: number;
  message?: string;
};

type AnalyzeResponse = {
  step_complete: boolean;
  feedback: string;
  detected: string[];
  scene_summary?: string;
  next_step?: RepairStep | null;
  completed?: boolean;
  provider?: string;
};

const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8000";

export default function RepairAssistant() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState<RepairStep | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [feedback, setFeedback] = useState("Enable camera, then analyze a frame.");
  const [detected, setDetected] = useState<string[]>([]);
  const [sceneSummary, setSceneSummary] = useState("");
  const [provider, setProvider] = useState<string>("");

  const progressLabel = useMemo(() => {
    if (isCompleted) return "Repair flow completed";
    if (!totalSteps) return "Loading steps...";
    return `Step ${currentIndex + 1} of ${totalSteps}`;
  }, [currentIndex, isCompleted, totalSteps]);

  const fetchCurrentStep = useCallback(async () => {
    try {
      const res = await fetch(
        `${BACKEND_BASE_URL}/session/current-step?user_id=demo_user`
      );
      if (!res.ok) throw new Error(`step fetch failed (${res.status})`);
      const data: CurrentStepResponse = await res.json();

      if (data.completed) {
        setIsCompleted(true);
        setCurrentStep(null);
        setFeedback(data.message ?? "Repair finished.");
        return;
      }

      setIsCompleted(false);
      setCurrentStep(data.step ?? null);
      setCurrentIndex(data.current_index ?? 0);
      setTotalSteps(data.total_steps ?? 0);
    } catch (err) {
      setFeedback(
        `Could not reach backend (${err instanceof Error ? err.message : "unknown error"}).`
      );
    }
  }, []);

  const enableCamera = useCallback(async () => {
    if (cameraReady) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraReady(true);
      setCameraError("");
      setFeedback("Camera connected. Click Analyze Current Frame.");
    } catch (err) {
      setCameraError(
        `Camera access failed (${err instanceof Error ? err.message : "unknown error"}).`
      );
    }
  }, [cameraReady]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
  }, []);

  const captureFrameBlob = useCallback(async (): Promise<Blob | null> => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) {
      return null;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return null;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.8);
    });
  }, []);

  const analyzeCurrentFrame = useCallback(async () => {
    if (!cameraReady || !currentStep || isCompleted || isAnalyzing) return;
    const frame = await captureFrameBlob();
    if (!frame) {
      setFeedback("Could not capture frame. Try again.");
      return;
    }

    const formData = new FormData();
    formData.append("file", frame, "frame.jpg");

    setIsAnalyzing(true);
    try {
      const res = await fetch(
        `${BACKEND_BASE_URL}/session/analyze?user_id=demo_user`,
        { method: "POST", body: formData }
      );

      if (res.status === 429) {
        setFeedback("Rate limit reached. Wait and retry.");
        return;
      }
      if (!res.ok) throw new Error(`analyze failed (${res.status})`);

      const data: AnalyzeResponse = await res.json();
      setFeedback(data.feedback ?? "No feedback.");
      setDetected(Array.isArray(data.detected) ? data.detected : []);
      setSceneSummary(data.scene_summary ?? "");
      setProvider(data.provider ?? provider);

      if (data.step_complete) {
        await fetchCurrentStep();
      }
    } catch (err) {
      setFeedback(
        `Analysis failed (${err instanceof Error ? err.message : "unknown error"}).`
      );
    } finally {
      setIsAnalyzing(false);
    }
  }, [
    cameraReady,
    captureFrameBlob,
    currentStep,
    fetchCurrentStep,
    isAnalyzing,
    isCompleted,
    provider,
  ]);

  useEffect(() => {
    void fetchCurrentStep();
  }, [fetchCurrentStep]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        void analyzeCurrentFrame();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [analyzeCurrentFrame]);

  return (
    <section
      style={{
        width: "100%",
        maxWidth: "1100px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "1rem",
      }}
    >
      <div
        style={{
          border: "1px solid rgba(128,128,128,0.35)",
          padding: "0.8rem",
          display: "grid",
          gap: "0.75rem",
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            width: "100%",
            aspectRatio: "16 / 10",
            background: "#111",
            objectFit: "cover",
          }}
        />
        <canvas ref={canvasRef} style={{ display: "none" }} />

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => void enableCamera()}
            disabled={cameraReady}
            style={buttonStyle(!cameraReady)}
          >
            ENABLE CAMERA
          </button>

          <button
            type="button"
            onClick={() => void analyzeCurrentFrame()}
            disabled={!cameraReady || !currentStep || isCompleted || isAnalyzing}
            style={buttonStyle(cameraReady && !isCompleted && !isAnalyzing)}
          >
            {isAnalyzing ? "ANALYZING..." : "ANALYZE CURRENT FRAME"}
          </button>

          <button
            type="button"
            onClick={stopCamera}
            disabled={!cameraReady}
            style={buttonStyle(cameraReady)}
          >
            STOP CAMERA
          </button>
        </div>

        <p style={{ color: cameraError ? "#f87171" : "var(--muted)", fontSize: "0.85rem" }}>
          {cameraError || "Tip: press SPACE to analyze current frame."}
        </p>
      </div>

      <aside
        style={{
          border: "1px solid rgba(128,128,128,0.35)",
          padding: "0.8rem",
          display: "grid",
          alignContent: "start",
          gap: "0.6rem",
          minHeight: "420px",
          textAlign: "left",
        }}
      >
        <h3 style={{ fontSize: "0.95rem", letterSpacing: "0.08em" }}>REPAIR STATUS</h3>
        <p style={{ color: "var(--muted)" }}>{progressLabel}</p>
        {provider ? (
          <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Verifier: {provider}</p>
        ) : null}

        <div style={cardStyle}>
          <p style={{ color: "var(--muted)", marginBottom: "0.35rem" }}>Current instruction</p>
          <p style={{ fontWeight: 600 }}>
            {currentStep?.instruction ?? (isCompleted ? "Done." : "Loading current step...")}
          </p>
          {currentStep ? (
            <p style={{ color: "var(--muted)", marginTop: "0.35rem", fontSize: "0.85rem" }}>
              Target: `{currentStep.target_object}` | Action: `{currentStep.action}`
            </p>
          ) : null}
        </div>

        <div style={cardStyle}>
          <p style={{ color: "var(--muted)", marginBottom: "0.35rem" }}>AI feedback</p>
          <p>{feedback}</p>
        </div>

        <div style={cardStyle}>
          <p style={{ color: "var(--muted)", marginBottom: "0.35rem" }}>Scene summary</p>
          <p>{sceneSummary || "No scene summary yet. Analyze a frame to view it."}</p>
        </div>

        <div style={cardStyle}>
          <p style={{ color: "var(--muted)", marginBottom: "0.35rem" }}>Detected objects</p>
          <p>{detected.length ? detected.join(", ") : "None reported"}</p>
        </div>
      </aside>
    </section>
  );
}

function buttonStyle(enabled: boolean) {
  return {
    border: "none",
    background: enabled ? "var(--accent)" : "#666",
    color: "#0a0a0a",
    padding: "0.55rem 0.85rem",
    fontFamily: "'Outfit', monospace",
    fontSize: "0.8rem",
    letterSpacing: "0.08em",
    cursor: enabled ? "pointer" : "not-allowed",
    fontWeight: 700,
  } as const;
}

const cardStyle = {
  border: "1px solid rgba(128,128,128,0.35)",
  padding: "0.7rem",
};
