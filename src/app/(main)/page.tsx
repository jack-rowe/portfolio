"use client";

import { AnimatePresence, motion, useSpring } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Download,
  Github,
  Linkedin,
  Mail,
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const Particles = dynamic(() => import("@/components/Particles"), {
  ssr: false,
});

export default function PortfolioPage() {
  const cardRef = useRef<HTMLDivElement>(null);
  const rotateX = useSpring(0, { stiffness: 200, damping: 30 });
  const rotateY = useSpring(0, { stiffness: 200, damping: 30 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return;

      const rect = cardRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const mouseX = (e.clientX - centerX) / 40;
      const mouseY = (e.clientY - centerY) / 40;

      rotateX.set(Math.min(Math.max(-mouseY, -5), 5));
      rotateY.set(Math.min(Math.max(mouseX, -5), 5));
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Data
  const socialLinks = [
    { icon: Github, link: "https://github.com/jack-rowe", label: "GitHub" },
    {
      icon: Linkedin,
      link: "https://www.linkedin.com/in/jackjrowe/",
      label: "LinkedIn",
    },
    { icon: Mail, link: "mailto:rowejackj@gmail.com", label: "Email" },
  ];

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
        "An esp32 based e-ink dashboard that displays weather, calendar events, and more.",
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
    {
      title: "Portfolio",
      description: "A modern portfolio with smooth animations.",
      tech: ["Next.js", "TypeScript", "Tailwind CSS"],
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
    {
      title: "Portfolio",
      description: "A modern portfolio with smooth animations.",
      tech: ["Next.js", "TypeScript", "Tailwind CSS"],
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
    {
      title: "Portfolio",
      description: "A modern portfolio with smooth animations.",
      tech: ["Next.js", "TypeScript", "Tailwind CSS"],
      link: "#",
      github: "#",
    },
  ];

  const experiences = [
    {
      company: "Doctalk Inc.",
      role: "Fullstack Software Developer",
      duration: "Dec. 2022 - Present",
      location: "Toronto, ON (Remote)",
      points: [
        "Designed and implemented workflow builder feature for patient symptom evaluation",
        "Spearheaded calendar integration using TypeScript, React, and Next.js",
        "Optimized API calls with React Query",
        "Created centralized component library from Figma designs (50+ components)",
        "Implemented landing page with framer-motion animations",
      ],
    },
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

  const [isBottom, setIsBottom] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } =
        document.documentElement;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 50;
      setIsBottom(atBottom);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!entry.target.id) return;
            setActiveSection(entry.target.id.toLowerCase());
          }
        });
      },
      {
        rootMargin: "-20% 0px -20% 0px",
        threshold: 0.1,
      }
    );

    const sections = document.querySelectorAll("section");
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative overflow-hidden">
      <Particles />

      {/* Hero Section */}
      <section id="home" className="min-h-screen relative flex items-center ">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            {/* Left Content */}
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
                  {socialLinks.map(({ icon: Icon, link, label }) => (
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

            {/* Right Content */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="relative group hidden lg:block"
              style={{ perspective: 1000 }}
            >
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
                <Image
                  src="/JackHeadshot2.jpg"
                  alt="Avatar"
                  width={192}
                  height={192}
                  className="h-64 w-64 object-cover rounded-full"
                />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>
      {/* Scroll down indicator */}
      {!isBottom && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-8 left-0 right-0 text-center z-[999]"
        >
          <div className="inline-block animate-bounce">
            <ArrowDown className="text-gray-400" size={24} />
          </div>
        </motion.div>
      )}

      {/* Resume Section */}
      <section id="resume" className="min-h-screen py-20 relative">
        <div className="container mx-auto px-4 relative z-10">
          <div className="w-full flex items-center justify-between flex-col gap-4 mb-4 sm:mb-12 sm:flex-row">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Resume.
            </h2>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="flex justify-center"
            >
              <a
                href="/jack-rowe-resume.pdf"
                download
                className="flex items-center gap-2 bg-emerald-400/10 text-emerald-400 px-4 py-2 rounded-lg hover:bg-emerald-400/20 transition-all"
              >
                <Download size={18} />
                PDF Version
              </a>
            </motion.div>
          </div>

          {/* Contact Info */}
          <div className="mb-12 text-center">
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
          </div>

          {/* Experience */}
          <Section title="Experience">
            {experiences.map((exp, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
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

          {/* Education */}
          <Section title="Education">
            {education.map((edu, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
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

          {/* Skills */}
          <Section title="Technical Skills">
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
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

      {/* Projects Section */}
      <section id="projects" className="min-h-screen py-20 relative">
        <div className="container mx-auto px-4 relative z-10">
          <div className="w-full flex items-center justify-between flex-col gap-4 mb-4 sm:mb-12 sm:flex-row">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Projects.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, index) => (
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

      {/* Navigation Links */}
      {/* Mobile */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex md:hidden gap-4 backdrop-blur-lg bg-white/10 p-1 rounded-full border border-white/10">
        {["home", "resume", "projects"].map((section) => (
          <a
            key={section}
            href={`#${section}`}
            className={`px-4 py-2 rounded-full text-sm transition-all ${
              activeSection === section
                ? "bg-emerald-400/20 text-emerald-400"
                : "text-gray-400 hover:bg-white/10"
            }`}
            onClick={(e) => {
              e.preventDefault();
              const target = document.getElementById(section);
              if (target) {
                target.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
                window.history.pushState(null, "", `#${section}`);
              }
            }}
          >
            <span className="capitalize">{section}</span>
          </a>
        ))}
      </div>

      {/* Desktop */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 md:flex flex-col gap-4 hidden">
        {["home", "resume", "projects"].map((section) => (
          <a
            key={section}
            href={`#${section}`}
            className={`p-3 rounded-full transition-all flex items-center justify-center ${
              activeSection === section
                ? "bg-emerald-400/20 text-emerald-400"
                : "bg-white/5 hover:bg-white/10 text-gray-400"
            }`}
            onClick={(e) => {
              e.preventDefault();
              const target = document.getElementById(section);
              if (target) {
                target.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
                // Update URL hash without default jump behavior
                window.history.pushState(null, "", `#${section}`);
              }
            }}
          >
            <span className="text-xs capitalize">{section}</span>
          </a>
        ))}
      </div>
    </div>
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
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      className="mb-12"
    >
      <h2 className="text-2xl font-bold text-gray-100 mb-6">{title}</h2>
      {children}
    </motion.section>
  );
}
