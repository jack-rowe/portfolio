"use client";

import { Github, Linkedin, Mail } from "lucide-react";

export default function PortfolioPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-8">
      <div className="max-w-6xl w-full">
        {/* Main Name Display */}
        <div className="mb-12">
          <h1 className="font-clash text-7xl md:text-8xl lg:text-9xl font-bold">
            <span className="block text-primary">JACK</span>
            <span className="block text-foreground mt-2">ROWE</span>
          </h1>
          <div className="mt-6 text-xl md:text-2xl text-muted-foreground font-light tracking-wide">
            Full Stack Developer
          </div>
        </div>

        {/* Social Links */}
        <div className="flex gap-6 items-center">
          <a
            href="https://github.com/jack-rowe"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors duration-200"
          >
            <Github className="w-6 h-6" />
            <span className="text-sm font-medium">GitHub</span>
          </a>

          <a
            href="https://linkedin.com/in/jackjrowe"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors duration-200"
          >
            <Linkedin className="w-6 h-6" />
            <span className="text-sm font-medium">LinkedIn</span>
          </a>

          <a
            href="mailto:rowejackj@gmail.com"
            className="group flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors duration-200"
          >
            <Mail className="w-6 h-6" />
            <span className="text-sm font-medium">Email</span>
          </a>
        </div>
      </div>
    </div>
  );
}
