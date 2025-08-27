import { EDUCATION, EXPERIENCES, SKILLS } from "@/data";
import { Download, Github, Linkedin, Mail, Phone } from "lucide-react";
import { motion } from "motion/react";
import { Section } from "./Section";
import { AntiScrapingWrapper } from "@/components/AntiScrapingWrapper";

export const Resume = () => {
  return (
    <section id="resume" className="min-h-screen py-20 relative md:px-20">
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

          <div className="flex flex-col md:flex-row  justify-center items-center gap-4 text-gray-400 h-fit whitespace-nowrap">
            <AntiScrapingWrapper
              placeholder="View phone number"
              className="flex-shrink-0"
            >
              <a
                href="tel:2266885920"
                className="hover:text-emerald-400 transition-colors flex items-center gap-2"
              >
                <Phone size={18} />
                (226) 688-5920
              </a>
            </AntiScrapingWrapper>
            <AntiScrapingWrapper
              placeholder="View email"
              className="flex-shrink-0"
            >
              <a
                href="mailto:rowejackj@gmail.com"
                className="hover:text-emerald-400 transition-colors flex items-center gap-2"
              >
                <Mail size={18} />
                rowejackj@gmail.com
              </a>
            </AntiScrapingWrapper>
            <a
              href="https://linkedin.com/in/jackjrowe"
              target="_blank"
              className="hover:text-emerald-400 transition-colors flex items-center gap-2"
            >
              <Linkedin size={18} />
              linkedin.com/in/jackjrowe
            </a>
            <a
              href="https://github.com/jack-rowe"
              target="_blank"
              className="hover:text-emerald-400 transition-colors flex items-center gap-2"
            >
              <Github size={18} />
              github.com/jack-rowe
            </a>
          </div>
        </div>

        {/* Experience */}
        <Section title="Experience">
          {EXPERIENCES.map((exp, index) => (
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
          {EDUCATION.map((edu, index) => (
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
            {SKILLS.map((skill, index) => (
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
  );
};
