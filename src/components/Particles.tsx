"use client";

import { motion } from "motion/react";

export default function Particles() {
  return (
    <div className="absolute inset-0 z-0">
      {[...Array(100)].map((_, i) => {
        // Randomly determine if particle should be initially visible

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
              scale: 0,
              opacity: 0,
            }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 0.1, 0],
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              repeatType: "loop",
              delay: Math.random() * 5,
            }}
          />
        );
      })}
      {[...Array(50)].map((_, i) => {
        const startX = Math.random() * 100; // Match first set's spread
        const startY = Math.random() * 100;

        return (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-emerald-700 rounded-full"
            style={{
              left: `${startX}%`,
              top: `${startY}%`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 0.75, 0],
              x: `${Math.random() * 100 - 50}vw`,
              y: `${Math.random() * 100 - 50}vh`,
            }}
            transition={{
              duration: 8 + Math.random() * 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 2,
            }}
          />
        );
      })}
    </div>
  );
}
