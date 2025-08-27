import { LucideIcon } from "lucide-react";

export type TProject = {
  title: string;
  description: string;
  tech: string[];
  link?: string;
  github?: string;
};

export type TSocialLink = {
  icon: LucideIcon;
  link: string;
  label: string;
};

export type TExperience = {
  company: string;
  role: string;
  duration: string;
  location: string;
  points: string[];
};

export type TEducation = {
  institution: string;
  degree: string;
  duration: string;
  location: string;
  gpa?: string;
};
