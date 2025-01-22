// app/(main)/page.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Github, Linkedin, Mail, ArrowRight } from "lucide-react";
import Image from "next/image";

export default function Hero() {
  const heroVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <section className="min-h-screen flex items-center relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 z-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-white/5 rounded-full"
            style={{
              width: Math.random() * 30 + 10,
              height: Math.random() * 30 + 10,
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.2 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
              delay: i * 0.2,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.1 } },
            }}
          >
            <motion.p
              variants={heroVariants}
              className="text-lg text-emerald-400 mb-4 font-mono"
            >
              Hi, my name is
            </motion.p>

            <motion.h1
              variants={heroVariants}
              className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-6"
            >
              Jack Rowe.
            </motion.h1>

            <motion.div
              variants={heroVariants}
              className="text-3xl md:text-5xl font-bold text-gray-300 mb-6"
            >
              <span className="text-gray-400">I&apos;m a </span>
              <AnimatePresence mode="wait">
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="inline-block ml-2 text-emerald-400"
                >
                  Full-Stack Developer
                </motion.span>
              </AnimatePresence>
            </motion.div>

            <motion.p
              variants={heroVariants}
              className="text-gray-400 text-lg mb-8 max-w-xl"
            >
              Building digital experiences that combine creativity with
              technical excellence. Specializing in full-stack development and
              modern web technologies.
            </motion.p>

            <motion.div
              variants={heroVariants}
              className="flex gap-4 items-center"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 bg-emerald-400/10 text-emerald-400 px-6 py-3 rounded-lg hover:bg-emerald-400/20 transition-all"
              >
                View Projects <ArrowRight size={18} />
              </motion.button>

              <div className="flex gap-4">
                {[
                  { icon: Github, link: "#" },
                  { icon: Linkedin, link: "#" },
                  { icon: Mail, link: "mailto:example@email.com" },
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
          </motion.div>

          {/* Right Content - Add your 3D avatar or image here */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="relative group"
            style={{
              perspective: 1000,
            }}
          >
            <div className="absolute inset-0 bg-emerald-400/20 blur-3xl rounded-full animate-pulse" />

            <motion.div
              className="relative h-96 w-96 mx-auto bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 flex items-center justify-center"
              style={{
                transformStyle: "preserve-3d",
              }}
              //   whileHover={{ scale: 1.05 }}
              onMouseMove={(e) => {
                const { clientX, clientY } = e;
                const rect = e.currentTarget.getBoundingClientRect();
                const x = (clientX - rect.left - rect.width / 2) / 20;
                const y = (clientY - rect.top - rect.height / 2) / 20;

                e.currentTarget.style.transform = `
        rotateY(${x}deg)
        rotateX(${-y}deg)
        translateZ(20px)
      `;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = `
        rotateY(0deg)
        rotateX(0deg)
        translateZ(0px)
      `;
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <motion.div
                className="h-64 w-64 bg-white/5 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden"
                style={{
                  transformStyle: "preserve-3d",
                }}
              >
                <Image
                  src="/JackHeadshot2.jpg"
                  alt="Avatar"
                  width={192}
                  height={192}
                  className="h-full w-full object-cover"
                  style={{
                    transform: "translateZ(40px)",
                  }}
                />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
