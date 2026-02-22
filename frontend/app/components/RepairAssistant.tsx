"use client";

import { useEffect, useRef, useState } from "react";

type ChatEntry = {
  role: "system" | "gemini";
  text: string;
};

export default function RepairAssistant() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [chatLog, setChatLog] = useState<ChatEntry[]>([
    {
      role: "system",
      text: "Enable webcam to begin using Felix.",
    },
  ]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLog]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // -------------------------------
  // Enable Camera + Mic
  // -------------------------------
  const enableCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraOn(true);
      setChatLog((prev) => [
        ...prev,
        {
          role: "system",
          text: "Camera + microphone connected. Press START RECORDING to speak to Felix.",
        },
      ]);
    } catch {
      setChatLog((prev) => [
        ...prev,
        {
          role: "system",
          text: "Camera/microphone permission denied. Please allow access and refresh.",
        },
      ]);
    }
  };

  // -------------------------------
  // Start Recording
  // -------------------------------
  const startRecording = () => {
    if (!streamRef.current || isRecording) return;

    const recorder = new MediaRecorder(streamRef.current);
    mediaRecorderRef.current = recorder;
    audioChunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    recorder.start();
    setIsRecording(true);

    setChatLog((prev) => [
      ...prev,
      { role: "system", text: "Recording..." },
    ]);
  };

  // -------------------------------
  // Stop Recording + Send to Backend
  // -------------------------------
  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.stop();
    setIsRecording(false);

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });

      await sendToBackend(audioBlob);
    };
  };

  // -------------------------------
  // Capture Frame + Send
  // -------------------------------
  const sendToBackend = async (audioBlob: Blob) => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);

    const imageBlob: Blob = await new Promise((resolve) =>
      canvas.toBlob((blob) => resolve(blob!), "image/jpeg")
    );

    const formData = new FormData();
    formData.append("image", imageBlob, "frame.jpg");
    formData.append("audio", audioBlob, "audio.webm");

    setChatLog((prev) => [
      ...prev,
      { role: "system", text: "Analyzing with Felix..." },
    ]);

    try {
      const response = await fetch("http://localhost:8000/felix/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      setChatLog((prev) => [
        ...prev,
        { role: "system", text: `You: ${data.transcription}` },
        { role: "gemini", text: data.felix_response },
      ]);

      if (data.audio_base64) {
        playAudioBase64(data.audio_base64);
      }
    } catch {
      setChatLog((prev) => [
        ...prev,
        {
          role: "system",
          text: "Backend error. Make sure FastAPI is running.",
        },
      ]);
    }
  };

  // -------------------------------
  // Play ElevenLabs Audio
  // -------------------------------
  const playAudioBase64 = (base64: string) => {
    const audio = new Audio(`data:audio/mp3;base64,${base64}`);
    audio.play().catch((err) => {
      console.error("Audio playback failed:", err);
    });
  };

  // -------------------------------
  // UI
  // -------------------------------
  return (
    <section
      style={{
        width: "100%",
        maxWidth: "1100px",
        display: "grid",
        gridTemplateColumns: "1.15fr 0.85fr",
        gap: "1rem",
        alignItems: "start",
      }}
    >
      {/* Left: Video + Buttons */}
      <div
        style={{
          border: "1px solid rgba(128,128,128,0.35)",
          padding: "0.8rem",
          display: "flex",
          flexDirection: "column",
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

        {/* Buttons — fixed height, no growth */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
            flexShrink: 0,
          }}
        >
          {!cameraOn && (
            <button
              onClick={enableCamera}
              style={{
                height: "38px",
                padding: "0 1rem",
                background: "#38bdf8",
                border: "none",
                color: "#0a0a0a",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "0.8rem",
                whiteSpace: "nowrap",
              }}
            >
              ENABLE CAMERA & MICROPHONE
            </button>
          )}

          {cameraOn && (
            <>
              <button
                onClick={startRecording}
                disabled={isRecording}
                style={{
                  height: "38px",
                  padding: "0 1rem",
                  background: isRecording ? "#666" : "#22c55e",
                  border: "none",
                  color: "#fff",
                  cursor: isRecording ? "not-allowed" : "pointer",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  whiteSpace: "nowrap",
                }}
              >
                START RECORDING
              </button>

              <button
                onClick={stopRecording}
                disabled={!isRecording}
                style={{
                  height: "38px",
                  padding: "0 1rem",
                  background: !isRecording ? "#666" : "#ef4444",
                  border: "none",
                  color: "#fff",
                  cursor: !isRecording ? "not-allowed" : "pointer",
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  whiteSpace: "nowrap",
                }}
              >
                STOP RECORDING
              </button>
            </>
          )}
        </div>
      </div>

      {/* Right: Chat Log with fixed height + scroll */}
      <aside
        style={{
          border: "1px solid rgba(128,128,128,0.35)",
          padding: "0.8rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.6rem",
          height: "420px",
        }}
      >
        <h3 style={{ margin: 0, flexShrink: 0 }}>FELIX CHAT LOG</h3>

        <div
          style={{
            overflowY: "auto",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "0.55rem",
            paddingRight: "0.25rem",
          }}
        >
          {chatLog.map((entry, index) => (
            <p key={`${entry.role}-${index}`} style={{ margin: 0 }}>
              <span style={{ fontWeight: 600 }}>
                {entry.role === "gemini" ? "Felix: " : "System: "}
              </span>
              {entry.text}
            </p>
          ))}
          {/* Anchor for auto-scroll */}
          <div ref={chatEndRef} />
        </div>
      </aside>
    </section>
  );
}
