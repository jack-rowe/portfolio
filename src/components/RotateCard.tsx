"use client";

import { motion, useSpring } from "framer-motion";
import { useEffect, useRef } from "react";

type MotionCardProps = {
  children: React.ReactNode;
  className?: string;
};

export const MotionCard = ({ children, className }: MotionCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const rotateX = useSpring(0, { stiffness: 200, damping: 30 });
  const rotateY = useSpring(0, { stiffness: 200, damping: 30 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return;

      const rect = cardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const mouseX = (e.clientX - centerX) / 40;
      const mouseY = (e.clientY - centerY) / 40;

      rotateX.set(Math.min(Math.max(-mouseY, -5), 5));
      rotateY.set(Math.min(Math.max(mouseX, -5), 5));
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <motion.div
      ref={cardRef}
      className={`relative bg-white/5 backdrop-blur-lg rounded-3xl border-2 border-white/10 hover:border-emerald-400/20 transition-all ${className}`}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        boxShadow: "0 25px 50px -12px rgba(16, 185, 129, 0.1)",
      }}
    >
      {/* Inner glow effect */}
      <div className="absolute inset-0 rounded-3xl pointer-events-none border-[1px] border-white/5 bg-gradient-to-b from-transparent via-emerald-400/5 to-transparent" />
      {children}
    </motion.div>
  );
};
