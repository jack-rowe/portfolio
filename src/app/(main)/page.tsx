"use client";

import { Navigation } from "@/app/(main)/components/Navigation";
import { ScrollDownIndicator } from "@/components/ScrollDownIndicator";
import dynamic from "next/dynamic";
import { Hero } from "./components/Hero";
import { Projects } from "./components/Projects";
import { Resume } from "./components/Resume";

const Particles = dynamic(() => import("@/components/Particles"), {
  ssr: false,
});

export default function PortfolioPage() {
  return (
    <div className="relative overflow-hidden" data-cursor="button">
      <Particles />
      <Hero />
      <ScrollDownIndicator />
      <Resume />
      <Projects />
      <Navigation />
    </div>
  );
}
