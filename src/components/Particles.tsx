"use client";

import { motion } from "framer-motion";

export default function Particles() {
  return (
    <div className="absolute inset-0 z-0">
      {[...Array(40)].map((_, i) => {
        // Randomly determine if particle should be initially visible
        const isInitial = Math.random() < 0.2; // 30% chance to be visible on load

        return (
          <motion.div
            key={i}
            className="absolute bg-white/15 rounded-full"
            style={{
              width: `${Math.random() * 30 + 1000}px`, // Fixed width calculation (removed 1000)
              height: `${Math.random() * 30 + 10}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 120 - 20}%`, // Allow negative positioning (-20% to 100%)
            }}
            initial={{
              scale: isInitial ? 1 : 0,
              opacity: isInitial ? 0.1 : 0,
            }}
            animate={{
              scale: [isInitial ? 1 : 0, 1, 0],
              opacity: [isInitial ? 0.1 : 0, 0.1, 0],
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              repeatType: "loop",
              delay: isInitial ? 0 : Math.random() * 5,
            }}
          />
        );
      })}
    </div>
  );
}
