import type { Metadata } from "next";
import { ReactNode } from "react";
import { Saira, Saira_Condensed, Spline_Sans_Mono } from "next/font/google";
import "./fantasy.css";

const saira = Saira({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-saira",
  display: "swap",
});

const sairaCondensed = Saira_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-saira-condensed",
  display: "swap",
});

const splineMono = Spline_Sans_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-spline-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Trade Desk — Sleeper Trade Finder",
  description:
    "Finds trades both sides should accept, from your real Sleeper league.",
  robots: { index: false, follow: false },
};

export default function FantasyLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`fantasy-scope ${saira.variable} ${sairaCondensed.variable} ${splineMono.variable}`}
    >
      {children}
    </div>
  );
}
