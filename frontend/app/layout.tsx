import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import ThemeToggle from "./components/ThemeToggle";

export const metadata: Metadata = {
  title: "AI-FIXIT",
  description: "Diagnose, repair, and sustain your devices — reduce e-waste.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body style={{ fontFamily: "'Outfit', monospace" }}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.75rem 1.5rem 0 1.5rem",
          }}
        >
          <div style={{ width: "40px" }} />
          <Navbar />
          <ThemeToggle />
        </header>
        {children}
      </body>
    </html>
  );
}
