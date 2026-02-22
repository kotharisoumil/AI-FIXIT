"use client";

import { useEffect, useRef, useState } from "react";

type ChatEntry = {
  role: "system" | "gemini";
  text: string;
};

const guidanceLines = [
  "I can see heavy background activity. Start by closing non-essential apps.",
  "Open battery settings and enable power-save mode for immediate improvement.",
  "Reduce screen brightness to about 60 percent and disable unnecessary Bluetooth scanning.",
  "Run for one charge cycle and compare drain rate before replacing hardware.",
];

export default function RepairAssistant() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [chatLog, setChatLog] = useState<ChatEntry[]>([
    {
      role: "system",
      text: "Transcript will appear here after webcam access is enabled.",
    },
  ]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  const enableCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraOn(true);
      setChatLog([
        {
          role: "system",
          text: "Webcam connected. You can start recording and generate Gemini transcript guidance.",
        },
      ]);
    } catch {
      setChatLog([
        {
          role: "system",
          text: "Camera access was blocked. Please allow browser video/microphone permission and try again.",
        },
      ]);
    }
  };

  const startRecording = () => {
    if (!streamRef.current || isRecording) {
      return;
    }

    if (typeof MediaRecorder === "undefined") {
      setChatLog((prev) => [
        ...prev,
        {
          role: "system",
          text: "Recording is not supported in this browser, but live webcam preview still works.",
        },
      ]);
      return;
    }

    const recorder = new MediaRecorder(streamRef.current);
    mediaRecorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
    setChatLog((prev) => [
      ...prev,
      {
        role: "system",
        text: "Recording started. This is a local placeholder stream until CV backend is connected.",
      },
    ]);

    recorder.onstop = () => {
      setIsRecording(false);
      setChatLog((prev) => [
        ...prev,
        {
          role: "system",
          text: "Recording stopped.",
        },
      ]);
    };
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const playGuidance = async () => {
    if (isSpeaking) {
      return;
    }

    setIsSpeaking(true);
    setChatLog((prev) => [
      ...prev,
      {
        role: "system",
        text: "Gemini transcript stream started (placeholder for Gemini + ElevenLabs integration).",
      },
    ]);

    for (const line of guidanceLines) {
      setChatLog((prev) => [...prev, { role: "gemini", text: line }]);
      await new Promise<void>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(line);
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        window.speechSynthesis.speak(utterance);
      });
    }

    setChatLog((prev) => [
      ...prev,
      {
        role: "system",
        text: "Guidance complete.",
      },
    ]);
    setIsSpeaking(false);
  };

  return (
    <section
      style={{
        width: "100%",
        maxWidth: "1100px",
        display: "grid",
        gridTemplateColumns: "1.15fr 0.85fr",
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

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={enableCamera}
            style={{
              border: "none",
              background: "var(--foreground)",
              color: "var(--background)",
              padding: "0.55rem 0.85rem",
              fontFamily: "'Outfit', monospace",
              fontSize: "0.8rem",
              letterSpacing: "0.08em",
              cursor: "pointer",
            }}
          >
            ENABLE VIDEO
          </button>

          <button
            type="button"
            onClick={startRecording}
            disabled={!cameraOn || isRecording}
            style={{
              border: "none",
              background: !cameraOn || isRecording ? "#666" : "var(--accent)",
              color: "#0a0a0a",
              padding: "0.55rem 0.85rem",
              fontFamily: "'Outfit', monospace",
              fontSize: "0.8rem",
              letterSpacing: "0.08em",
              cursor: !cameraOn || isRecording ? "not-allowed" : "pointer",
              fontWeight: 700,
            }}
          >
            START RECORDING
          </button>

          <button
            type="button"
            onClick={stopRecording}
            disabled={!isRecording}
            style={{
              border: "none",
              background: !isRecording ? "#666" : "#ef4444",
              color: "#fff",
              padding: "0.55rem 0.85rem",
              fontFamily: "'Outfit', monospace",
              fontSize: "0.8rem",
              letterSpacing: "0.08em",
              cursor: !isRecording ? "not-allowed" : "pointer",
            }}
          >
            STOP RECORDING
          </button>

          <button
            type="button"
            onClick={playGuidance}
            disabled={!cameraOn || isSpeaking}
            style={{
              border: "none",
              background: !cameraOn || isSpeaking ? "#666" : "#38bdf8",
              color: "#0a0a0a",
              padding: "0.55rem 0.85rem",
              fontFamily: "'Outfit', monospace",
              fontSize: "0.8rem",
              letterSpacing: "0.08em",
              cursor: !cameraOn || isSpeaking ? "not-allowed" : "pointer",
              fontWeight: 700,
            }}
          >
            PLAY VOICE GUIDE
          </button>
        </div>
      </div>

      <aside
        style={{
          border: "1px solid rgba(128,128,128,0.35)",
          padding: "0.8rem",
          display: "grid",
          gridTemplateRows: "auto 1fr",
          gap: "0.6rem",
          minHeight: "420px",
        }}
      >
        <h3 style={{ fontSize: "0.95rem", letterSpacing: "0.08em", textAlign: "left" }}>
          GEMINI CHAT LOG
        </h3>
        <div
          style={{
            overflowY: "auto",
            display: "grid",
            alignContent: "start",
            gap: "0.55rem",
            textAlign: "left",
          }}
        >
          {chatLog.map((entry, index) => (
            <p
              key={`${entry.role}-${index}`}
              style={{
                fontSize: "0.84rem",
                lineHeight: 1.45,
                color: entry.role === "gemini" ? "var(--foreground)" : "var(--muted)",
              }}
            >
              {entry.role === "gemini" ? "Gemini: " : "System: "}
              {entry.text}
            </p>
          ))}
        </div>
      </aside>
    </section>
  );
}
