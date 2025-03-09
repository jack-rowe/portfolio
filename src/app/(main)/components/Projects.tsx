import { PROJECTS } from "@/data";
import { ArrowUpRight, Github } from "lucide-react";
import { motion } from "motion/react";

export const Projects = () => {
  return (
    <section id="projects" className="min-h-screen py-20 relative md:px-20">
      <div className="container mx-auto px-4 relative z-10">
        <div className="w-full flex items-center justify-between flex-col gap-4 mb-4 sm:mb-12 sm:flex-row">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Projects.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {PROJECTS.map((project, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
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
      </div>
    </section>
  );
};
