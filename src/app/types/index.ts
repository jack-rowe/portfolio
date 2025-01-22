export interface Skill {
  name: string;
  level: "Beginner" | "Intermediate" | "Advanced" | "Expert";
}

export interface Project {
  id: number;
  title: string;
  tech: string;
  description?: string;
}
