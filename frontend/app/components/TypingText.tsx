"use client";

import { useEffect, useState, useRef } from "react";

const phrases = [
  "Don't replace it. Repair it.",
  "Extend your device's life.",
  "Reduce e-waste, one fix at a time.",
  "Your device deserves a second chance.",
];

export default function TypingText() {
  const [displayed, setDisplayed] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const current = phrases[phraseIndex];
    const typeSpeed = 60;
    const deleteSpeed = 35;
    const pauseAfterType = 2000;
    const pauseAfterDelete = 400;

    if (!isDeleting && displayed.length < current.length) {
      timeoutRef.current = setTimeout(() => {
        setDisplayed(current.slice(0, displayed.length + 1));
      }, typeSpeed);
    } else if (!isDeleting && displayed.length === current.length) {
      timeoutRef.current = setTimeout(() => {
        setIsDeleting(true);
      }, pauseAfterType);
    } else if (isDeleting && displayed.length > 0) {
      timeoutRef.current = setTimeout(() => {
        setDisplayed(current.slice(0, displayed.length - 1));
      }, deleteSpeed);
    } else if (isDeleting && displayed.length === 0) {
      timeoutRef.current = setTimeout(() => {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
      }, pauseAfterDelete);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [displayed, isDeleting, phraseIndex]);

  return (
    <span
      style={{
        fontFamily: "'Outfit', monospace",
        fontSize: "1.15rem",
        fontWeight: 300,
        color: "var(--muted)",
        letterSpacing: "0.02em",
      }}
    >
      {displayed}
      <span className="typing-cursor" />
    </span>
  );
}
