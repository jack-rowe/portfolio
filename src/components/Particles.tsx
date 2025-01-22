"use client";

import { motion } from "framer-motion";

export default function Particles() {
  return (
    <div className="absolute inset-0 z-0">
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute bg-white/15 rounded-full"
          style={{
            width: `${Math.random() * 30 + 1000}px`,
            height: `${Math.random() * 30 + 10}px`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
          initial={{ scale: 0, opacity: 0 }}
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
      ))}
    </div>
  );
}
