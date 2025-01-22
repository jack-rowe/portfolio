"use client";

import { motion, AnimatePresence, useSpring } from "framer-motion";
import { Github, Linkedin, Mail, ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

const Particles = dynamic(() => import("@/components/Particles"), {
  ssr: false,
});

export default function Hero() {
  const heroVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const cardRef = useRef<HTMLDivElement>(null);
  const rotateX = useSpring(0, { stiffness: 200, damping: 30 });
  const rotateY = useSpring(0, { stiffness: 200, damping: 30 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return;

      const rect = cardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const mouseX = (e.clientX - centerX) / 40; // Reduced sensitivity
      const mouseY = (e.clientY - centerY) / 40; // Reduced sensitivity

      // Apply constraints for subtle movement
      rotateX.set(Math.min(Math.max(-mouseY, -5), 5)); // Limit to ±5 degrees
      rotateY.set(Math.min(Math.max(mouseX, -5), 5)); // Limit to ±5 degrees
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section className="min-h-screen relative overflow-hidden">
      <Particles />

      <div className="container mx-auto px-4 relative z-10 h-screen flex items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid lg:grid-cols-2 gap-12 items-center w-full"
        >
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <motion.h1
              initial="hidden"
              animate="visible"
              variants={heroVariants}
              className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-6"
            >
              Jack Rowe.
            </motion.h1>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={heroVariants}
              className="text-2xl md:text-4xl font-bold text-gray-300 mb-6"
            >
              <AnimatePresence mode="wait">
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="inline-block"
                >
                  Full-Stack Developer
                </motion.span>
              </AnimatePresence>
            </motion.div>

            <motion.p
              initial="hidden"
              animate="visible"
              variants={heroVariants}
              className="text-gray-400 text-lg mb-8 max-w-xl mx-auto lg:mx-0"
            >
              Building digital experiences that combine creativity with
              technical excellence. Specializing in full-stack development and
              modern web technologies.
            </motion.p>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={heroVariants}
              className="flex flex-col sm:flex-row gap-4 items-center justify-center lg:justify-start"
            >
              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 bg-emerald-400/10 text-emerald-400 px-6 py-3 rounded-lg hover:bg-emerald-400/20 transition-all"
                >
                  <Link href="/projects">View Projects</Link>
                  <ArrowRight size={18} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 bg-cyan-400/10 text-cyan-400 px-6 py-3 rounded-lg hover:bg-cyan-400/20 transition-all"
                >
                  <Link href="/resume">View Resume</Link>
                  <ArrowRight size={18} />
                </motion.button>
              </div>

              <div className="flex gap-4">
                {[
                  { icon: Github, link: "https://github.com/jack-rowe" },
                  {
                    icon: Linkedin,
                    link: "https://www.linkedin.com/in/jackjrowe/",
                  },
                  { icon: Mail, link: "mailto:rowejackj@gmail.com" },
                ].map(({ icon: Icon, link }, i) => (
                  <motion.a
                    key={i}
                    href={link}
                    target="_blank"
                    whileHover={{ y: -3 }}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-all"
                  >
                    <Icon size={20} className="text-gray-300" />
                  </motion.a>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="relative group hidden lg:block"
            style={{ perspective: 1000 }}
          >
            {/* Animated inner particles */}
            <div className="absolute inset-0 z-0 overflow-hidden rounded-3xl">
              {[...Array(10)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute bg-emerald-400/10 rounded-full"
                  style={{
                    width: Math.random() * 20 + 10,
                    height: Math.random() * 20 + 10,
                    top: Math.random() * 100 + "%",
                    left: Math.random() * 100 + "%",
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.1 }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatType: "reverse",
                    delay: i * 0.3,
                  }}
                />
              ))}
            </div>

            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-cyan-400/10 blur-2xl opacity-30 animate-pulse rounded-3xl" />

            <motion.div
              ref={cardRef}
              className="relative h-96 w-96 mx-auto bg-white/5 backdrop-blur-lg rounded-3xl border-2 border-white/10 flex items-center justify-center hover:border-emerald-400/20 transition-all"
              style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d",
                boxShadow: "0 25px 50px -12px rgba(16, 185, 129, 0.1)",
              }}
            >
              {/* Inner glow effect */}
              <div className="absolute inset-0 rounded-3xl pointer-events-none border-[1px] border-white/5 bg-gradient-to-b from-transparent via-emerald-400/5 to-transparent" />

              <motion.div
                className="h-64 w-64 bg-white/5 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden relative"
                style={{
                  transformStyle: "preserve-3d",
                }}
              >
                {/* Image container with matching theme */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-cyan-400/10 opacity-20" />
                <div className="absolute inset-0 backdrop-blur-sm" />

                <Image
                  src="/JackHeadshot2.jpg"
                  alt="Avatar"
                  width={192}
                  height={192}
                  className="h-full w-full object-cover relative z-10"
                  style={{
                    transform: "translateZ(20px)",
                    filter: "grayscale(20%) contrast(110%)",
                  }}
                />
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
