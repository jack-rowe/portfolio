"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";

export default function ResumePage() {
  const experiences = [
    {
      company: "Doctalk Inc.",
      role: "Fullstack Software Developer",
      duration: "Dec. 2022 - Present",
      location: "Toronto, ON (Remote)",
      points: [
        "Designed and implemented workflow builder feature for patient symptom evaluation",
        "Spearheaded calendar integration using TypeScript, React, and Next.js",
        "Optimized API calls with React Query, eliminating redundant network requests",
        "Created centralized component library from Figma designs (50+ components)",
        "Implemented landing page with framer-motion animations",
      ],
    },
    // {
    //   company: "Crossroads",
    //   role: "Manager",
    //   duration: "Jan. 2020 - Dec. 2022",
    //   location: "Woodstock, ON",
    //   points: [
    //     "Implemented loyalty program with 2,000+ participants",
    //     "Launched new retail location with team of 15 staff",
    //   ],
    // },
  ];

  const education = [
    {
      institution: "Fanshawe College",
      degree: "Advanced Diploma in Computer Programming & Analysis",
      gpa: "3.94 GPA",
      duration: "Jan. 2022 - Dec. 2024",
      location: "London, ON",
    },
    {
      institution: "University of Guelph",
      degree: "Honours BSc, Genetics, Deans Honours List",
      duration: "Sep. 2016 - Apr. 2020",
      location: "Guelph, ON",
    },
  ];

  const projects = [
    {
      name: "WikiGuessr",
      tech: "TypeScript, Next.js, Tailwind",
      description: "Wikipedia guessing game with leaderboards and user stats",
    },
    {
      name: "E-Paper Desk Dashboard",
      tech: "C++, ESP-32",
      description: "IoT dashboard integrating multiple APIs",
    },
  ];

  const skills = [
    "TypeScript",
    "JavaScript",
    "React",
    "Next.js",
    "Node.js",
    "Git",
    "CI/CD",
    "API Design",
    "Database Migrations",
    "Agile Development",
  ];

  return (
    <section className="min-h-screen relative overflow-hidden py-12">
      {/* Animated background particles */}
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
          <div className="flex justify-between items-start mb-8">
            <Link
              href="/"
              className="inline-flex items-center text-gray-400 hover:text-emerald-400 transition-colors"
            >
              <ArrowRight className="rotate-180 mr-2" size={18} />
              Back to Home
            </Link>
            <a
              href="/jack-rowe-resume.pdf"
              download
              className="flex items-center gap-2 bg-emerald-400/10 text-emerald-400 px-4 py-2 rounded-lg hover:bg-emerald-400/20 transition-all"
            >
              <Download size={18} />
              PDF Version
            </a>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-8">
            Resume.
          </h1>
        </motion.div>

        {/* Contact Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl font-bold text-gray-100 mb-4">Jack Rowe</h2>
          <div className="flex flex-wrap justify-center gap-4 text-gray-400">
            <a href="tel:2266885920">(226) 688-5920</a>
            <a href="mailto:rowejackj@gmail.com">rowejackj@gmail.com</a>
            <a
              href="https://linkedin.com/in/jackjrowe"
              target="_blank"
              className="hover:text-emerald-400 transition-colors"
            >
              linkedin.com/in/jackjrowe
            </a>
            <a
              href="https://github.com/jack-rowe"
              target="_blank"
              className="hover:text-emerald-400 transition-colors"
            >
              github.com/jack-rowe
            </a>
          </div>
        </motion.div>

        {/* Experience Section */}
        <Section title="Experience">
          {experiences.map((exp, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="mb-8 bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-100">
                    {exp.role}
                  </h3>
                  <p className="text-emerald-400">{exp.company}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-100">{exp.duration}</p>
                  <p className="text-sm text-gray-400">{exp.location}</p>
                </div>
              </div>
              <ul className="list-disc pl-6 space-y-2 text-gray-400">
                {exp.points.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </motion.div>
          ))}
        </Section>

        {/* Education Section */}
        <Section title="Education">
          {education.map((edu, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="mb-8 bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-gray-100">
                    {edu.institution}
                  </h3>
                  <p className="text-emerald-400">{edu.degree}</p>
                  {edu.gpa && (
                    <p className="text-sm text-gray-400">{edu.gpa}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-gray-100">{edu.duration}</p>
                  <p className="text-sm text-gray-400">{edu.location}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </Section>

        {/* Projects Section */}
        <Section title="Projects">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((project, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10"
              >
                <h3 className="text-lg font-semibold text-gray-100">
                  {project.name}
                </h3>
                <p className="text-sm text-emerald-400 mb-2">{project.tech}</p>
                <p className="text-gray-400">{project.description}</p>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* Skills Section */}
        <Section title="Technical Skills">
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="px-3 py-1 text-sm bg-emerald-400/10 text-emerald-400 rounded-full"
              >
                {skill}
              </motion.span>
            ))}
          </div>
        </Section>
      </div>
    </section>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mb-12"
    >
      <h2 className="text-2xl font-bold text-gray-100 mb-6">{title}</h2>
      {children}
    </motion.section>
  );
}
