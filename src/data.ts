import { Github, Linkedin, Mail } from "lucide-react";
import { TEducation, TExperience, TProject, TSocialLink } from "./types";

export const SOCIAL_LINKS: TSocialLink[] = [
  { icon: Github, link: "https://github.com/jack-rowe", label: "GitHub" },
  {
    icon: Linkedin,
    link: "https://www.linkedin.com/in/jackjrowe/",
    label: "LinkedIn",
  },
  { icon: Mail, link: "mailto:rowejackj@gmail.com", label: "Email" },
];

export const PROJECTS: TProject[] = [
  // {
  //   title: "Backroads Tours",
  //   description:
  //     "Full-stack golf event platform allowing users to create personalized events, track them live, and create personalized memory pages for each event.",
  //   tech: ["Next.js", "TypeScript", "Supabase"],
  //   link: "#",
  //   github: "#",
  // },
  {
    title: "E-Ink Dashboard",
    description:
      "An esp32 based e-ink dashboard that displays weather, calendar events, and more.",
    tech: ["C++", "ESP-32"],
  },
  {
    title: "Portfolio",
    description:
      "My portfolio site. This site also acts as a backend for various personal projects of mine.",
    tech: [
      "Next.js",
      "React",
      "TypeScript",
      "Tailwind CSS",
      "REST API",
      "Framer Motion",
    ],
  },
  {
    title: "WikiGuessr",
    description:
      "A daily game inspired by Framed.wtf. WikiGuessr challenges players to guess the correct wikipedia page based on a set of gradually more revelaing hints about the article.",
    tech: ["Next.js", "React", "TypeScript", "Tailwind CSS", "Supabase"],
    github: "https://github.com/h-sakhizada/WikiGuessr",
  },
];

export const EXPERIENCES: TExperience[] = [
  {
    company: "Doctalk Inc.",
    role: "Fullstack Software Developer",
    duration: "Dec. 2022 - Present",
    location: "Toronto, ON (Remote)",
    points: [
      "Designed and implemented a decision tree based workflow builder for patient symptom evaluation",
      "Spearheaded calendar integration using TypeScript, React, and Next.js",
      "Optimized API calls with React Query",
      "Created centralized component library from Figma designs (50+ components)",
      "Implemented landing page with motion/react animations",
    ],
  },
];

export const EDUCATION: TEducation[] = [
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

export const SKILLS = [
  "TypeScript",
  "JavaScript",
  "React",
  "Next.js",
  "Node.js",
  "Git",
  "CI/CD",
  "API Design",
  "Agile Development",
  "ReactFlow",
];
