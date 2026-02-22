"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "DIAGNOSE", href: "/diagnose" },
  { label: "REPAIR", href: "/repair" },
  { label: "RECOMMENDATIONS", href: "/dispose" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "2.5rem",
        padding: "1.5rem 0 0 0",
        fontFamily: "'Outfit', monospace",
      }}
    >
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              textDecoration: "none",
              fontSize: "0.85rem",
              fontWeight: 500,
              letterSpacing: "0.15em",
              color: isActive ? "var(--accent)" : "var(--muted)",
              transition: "color 0.2s ease",
              paddingBottom: "4px",
              borderBottom: isActive ? "2px solid var(--accent)" : "2px solid transparent",
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.color = "var(--foreground)";
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.color = "var(--muted)";
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
