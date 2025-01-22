"use client";

import { motion, AnimatePresence } from "framer-motion";

export default function SplashScreen({ isLoading }: { isLoading: boolean }) {
  const svgPath =
    "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z";

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed inset-0 z-50 bg-gray-950 flex items-center justify-center overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, delay: 0.8, ease: "easeInOut" }}
        >
          {/* Floating Particles */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-emerald-400 rounded-full"
              initial={{
                scale: 0,
                x: Math.random() * 100 - 50 + "vw",
                y: Math.random() * 100 - 50 + "vh",
              }}
              animate={{
                scale: [0, 1, 0],
                x: Math.random() * 100 - 50 + "vw",
                y: Math.random() * 100 - 50 + "vh",
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 1,
              }}
            />
          ))}
          {/* Animated SVG Circle - Burst Animation */}
          <motion.svg
            className="fixed w-[100vmax] h-[100vmax]"
            viewBox="0 0 24 24"
            initial={{ scale: 0, rotate: 0, opacity: 1 }}
            animate={{ scale: 1.5, rotate: 360, opacity: 1 }}
            exit={{
              scale: 40,
              opacity: 0,
              transition: {
                scale: { duration: 0.8, ease: "circIn" },
                opacity: { duration: 0.3, delay: 0.8 },
              },
            }}
            transition={{
              duration: 1.5,
              ease: "easeInOut",
            }}
            style={{ originX: "center", originY: "center" }}
          >
            <motion.path
              d={svgPath}
              stroke="url(#gradient)"
              strokeWidth="2.5"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: 1.5,
                ease: "easeInOut",
              }}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
          </motion.svg>
          {/* Main Text */}
          <motion.div
            className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent relative"
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{
              scale: 1.2,
              opacity: 0,
              transition: {
                duration: 0.5,
                delay: 0.4,
              },
            }}
            transition={{
              duration: 0.8,
              ease: "easeInOut",
              delay: 0.3,
            }}
          >
            {/* Letter Animation */}
            <div className="flex">
              {["J", "A", "C", "K", "\u00A0", "R", "O", "W", "E"].map(
                (letter, i) => (
                  <motion.span
                    key={i}
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: i * 0.05 + 0.5,
                      ease: "backOut",
                    }}
                  >
                    {letter}
                  </motion.span>
                )
              )}
            </div>

            {/* Animated Underline */}
            <motion.div
              className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-cyan-400"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              exit={{ scaleX: 0 }}
              transition={{
                duration: 0.8,
                delay: 1,
                ease: "easeInOut",
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
