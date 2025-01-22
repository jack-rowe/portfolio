"use client";

import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Github } from "lucide-react";
import Link from "next/link";

export default function ProjectsPage() {
  const projects = [
    {
      title: "Backroads Tours",
      description:
        "Full-stack golf event platform allowing users to create personalized events, track them live, and create personalized memory pages for each event.",
      tech: ["Next.js", "TypeScript", "Supabase"],
      link: "#",
      github: "#",
    },
    {
      title: "E-Ink Dashboard",
      description:
        "An esp32 based e-ink dashboard that displays weather, calendar events, and more. The dashboard is updated every 30 minutes. This project utilizes an API hosted within this website to handle complex and memory-intensive tasks.",
      tech: ["C++", "ESP-IDF"],
      link: "#",
      github: "#",
    },
    {
      title: "Portfolio",
      description: "A modern portfolio with smooth animations.",
      tech: ["Next.js", "TypeScript", "Tailwind CSS"],
      link: "#",
      github: "#",
    },
  ];

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <section className="min-h-screen relative overflow-hidden py-20">
      {/* Animated background particles - Same as hero page */}
      <div className="absolute inset-0 z-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-white/15 rounded-full"
            style={{
              width: Math.random() * 30 + 1000,
              height: Math.random() * 30 + 10,
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.1 }}
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            href="/"
            className="inline-flex items-center text-gray-400 hover:text-emerald-400 transition-colors mb-8"
          >
            <ArrowRight className="rotate-180 mr-2" size={18} />
            Back to Home
          </Link>

          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-12">
            Projects.
          </h1>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative h-full bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:border-emerald-400/20 transition-all"
            >
              <div className="absolute inset-0 bg-emerald-400/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-100">
                    {project.title}
                  </h3>
                  <div className="flex gap-2">
                    {project.github && (
                      <a
                        href={project.github}
                        target="_blank"
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Github size={18} className="text-gray-400" />
                      </a>
                    )}
                    {project.link && (
                      <a
                        href={project.link}
                        target="_blank"
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <ArrowUpRight size={18} className="text-gray-400" />
                      </a>
                    )}
                  </div>
                </div>

                <p className="text-gray-400 text-sm mb-6">
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {project.tech.map((tech, techIndex) => (
                    <span
                      key={techIndex}
                      className="px-3 py-1 text-xs bg-emerald-400/10 text-emerald-400 rounded-full"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center text-gray-400"
        >
          More projects coming soon...
        </motion.div>
      </div>
    </section>
  );
}
