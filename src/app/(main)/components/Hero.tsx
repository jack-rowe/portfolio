import { MotionCard } from "@/components/RotateCard";
import { SOCIAL_LINKS } from "@/data";
import { ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";

export const Hero = () => {
  return (
    <section
      id="home"
      className="min-h-screen relative flex items-center md:px-20"
    >
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid lg:grid-cols-2 gap-12 items-center"
        >
          <div className="text-center lg:text-left">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-6"
            >
              Jack Rowe.
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-gray-400 text-lg mb-8 max-w-xl mx-auto lg:mx-0"
            >
              Building digital experiences that combine creativity with
              technical excellence.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row gap-4 items-center justify-center lg:justify-start"
            >
              <div className="flex gap-4">
                <a
                  href="#projects"
                  className="flex items-center gap-2 bg-emerald-400/10 text-emerald-400 px-6 py-3 rounded-lg hover:bg-emerald-400/20 transition-all"
                >
                  View Projects
                  <ArrowRight size={18} />
                </a>

                <a
                  href="#resume"
                  className="flex items-center gap-2 bg-cyan-400/10 text-cyan-400 px-6 py-3 rounded-lg hover:bg-cyan-400/20 transition-all"
                >
                  View Resume
                  <ArrowRight size={18} />
                </a>
              </div>

              <div className="flex gap-4">
                {SOCIAL_LINKS.map(({ icon: Icon, link, label }) => (
                  <motion.a
                    key={label}
                    href={link}
                    target="_blank"
                    whileHover={{ y: -3 }}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-all"
                    aria-label={label}
                  >
                    <Icon size={20} className="text-gray-300" />
                  </motion.a>
                ))}
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="relative group hidden lg:block"
            style={{ perspective: 1000 }}
          >
            <MotionCard className="h-[30rem] w-[30rem] mx-auto flex items-center justify-center">
              <motion.div
                className="h-[20rem] w-[20rem] bg-white/5 rounded-full border-white/10 flex items-center justify-center overflow-hidden relative"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-cyan-400/10 opacity-20" />
                <div className="absolute inset-0 backdrop-blur-sm" />

                <div className="relative h-full w-full crt-effect">
                  <Image
                    src="/JackHeadshot2.jpg"
                    alt="Avatar"
                    width={192}
                    height={192}
                    className="h-full w-full object-cover relative z-10 rounded-lg"
                    style={{
                      filter: "grayscale(20%) contrast(110%)",
                      transform: "scaleX(-1)",
                    }}
                  />

                  {/* CRT Effects */}
                  <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
                    <div
                      className="absolute inset-0 bg-[repeating-linear-gradient(transparent_0px,transparent_1px,rgba(52,211,153,0.5)_2px,rgba(34,211,238,0.5)_3px)] opacity-50"
                      style={{
                        backgroundSize: "100% 4px",
                        animation: "scanline 16s linear infinite",
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            </MotionCard>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
