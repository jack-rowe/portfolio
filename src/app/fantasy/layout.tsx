import type { Metadata } from "next";
import { ReactNode } from "react";
import "./fantasy.css";

export const metadata: Metadata = {
  title: "Trade Desk — Sleeper Trade Finder",
  description:
    "Finds trades both sides should accept, from your real Sleeper league.",
  robots: { index: false, follow: false },
};

export default function FantasyLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Saira+Condensed:wght@500;600;700;800&family=Saira:wght@400;500;600&family=Spline+Sans+Mono:wght@400;500;600&display=swap"
        rel="stylesheet"
      />
      <div className="fantasy-scope">{children}</div>
    </>
  );
}
