import React from "react";
import { Card, CardContent, CardHeader } from "@/components/UI/card";
import Typography from "./UI/typography";
import Link from "next/link";

const Header = () => (
  <div className="text-center text-text">
    <Typography variant="h1" className="text-4xl font-bold">
      Jack Rowe
    </Typography>
    <div className="flex w-full bg-black gap-2 flex-wrap justify-center mt-6">
      <Typography variant="p">(226) 688-5920</Typography>

      <Typography variant="p">|</Typography>
      <Link
        href="mailto:rowejackj@gmail.com"
        className="text-accent hover:underline"
      >
        rowejackj@gmail.com
      </Link>
      <Typography variant="p">|</Typography>
      <Link
        href="https://linkedin.com/in/jackjrowe"
        className="text-accent hover:underline"
        target="_blank"
      >
        LinkedIn
      </Link>
      <Typography variant="p">|</Typography>
      <Link
        href="https://github.com/jack-rowe"
        className="text-accent hover:underline"
        target="_blank"
      >
        GitHub
      </Link>
    </div>
  </div>
);
type ListItemProps = {
  children: React.ReactNode;
};

const List = ({ children }: ListItemProps) => (
  <ul className="list-disc list-inside mt-2">{children}</ul>
);

const ListItem = ({ children }: ListItemProps) => (
  <li className="mb-2 ml-4 text-text">{children}</li>
);

type SectionProps = {
  title: React.ReactNode;
  children: React.ReactNode;
};

const Section = ({ title, children }: SectionProps) => (
  <section className="mt-8">
    <h2 className="text-xl font-semibold border-b border-secondary pb-1 text-text">
      {title}
    </h2>
    {children}
  </section>
);

type InfoItemProps = {
  left: React.ReactNode;
  right: React.ReactNode;
  children?: React.ReactNode;
};

const InfoItem = ({ left, right, children }: InfoItemProps) => (
  <div className="mt-4">
    <div className="flex justify-between">
      <div>
        <h3 className="font-bold text-text">{left}</h3>
        <p className="italic text-sm text-secondary">{children}</p>
      </div>
      <p className="italic text-sm text-secondary">{right}</p>
    </div>
  </div>
);

const Experience = () => (
  <Section title="Experience">
    <InfoItem left="Fullstack Software Developer" right="Dec. 2022 - Present">
      Doctalk Inc., Toronto, ON (Remote)
    </InfoItem>
    <List>
      <ListItem>
        Led the development of a calendar-integrated meetings system using
        <strong>Supabase Realtime</strong> and <strong>Next.js REST</strong>,
        enhancing data transfer efficiency and user experience.
      </ListItem>
      <ListItem>
        Built a custom component library from <strong>Figma</strong> designs,
        ensuring pixel-perfect design consistency and improved site
        cohesiveness.
      </ListItem>
      <ListItem>
        Developed a <strong>real-time broadcast system</strong> for
        client-to-client communication, significantly reducing content delivery
        time.
      </ListItem>
      <ListItem>
        Implemented a query cache using <strong>React Query</strong>,
        eliminating redundant network requests and enhancing performance.
      </ListItem>
      <ListItem>
        Designed and developed a <strong>workflow builder</strong> for
        clinicians to create customized treatment trees, guiding patients
        through various stages based on input.
      </ListItem>
    </List>

    <InfoItem left="Manager" right="Jan. 2020 - Dec. 2022">
      Crossroads, Woodstock, ON
    </InfoItem>
    <List>
      <ListItem>
        Directed a team of 10-20, achieving company objectives through strategic
        leadership and operational excellence.
      </ListItem>
      <ListItem>
        Spearheaded the launch of a new retail store by coordinating stock
        shipments, hiring staff, and installing essential hardware systems.
      </ListItem>
      <ListItem>
        Implemented a customer loyalty program, engaging over 2,000 participants
        and leveraging data from 10,000+ users through successful third-party
        software integration.
      </ListItem>
    </List>
  </Section>
);

const Education = () => (
  <Section title="Education">
    <InfoItem left="Fanshawe College" right="Jan. 2022 - Dec. 2024">
      Advanced Diploma in Computer Programming and Analysis | 3.91 GPA
    </InfoItem>
    <InfoItem left="University of Guelph" right="Sep. 2016 - Apr. 2020">
      Honours Bachelor of Science, Genetics
    </InfoItem>
  </Section>
);

const Projects = () => (
  <Section title="Projects">
    <InfoItem
      left="Golf Simulator (WIP)"
      right={
        <a href="sa" className="text-accent hover:underline">
          GitHub
        </a>
      }
    >
      Python, OpenCV, React, Supabase
    </InfoItem>
    <List>
      <ListItem>
        Developed a Raspberry Pi-based golf simulator with color-based ball
        recognition and velocity tracking using OpenCV.
      </ListItem>
      <ListItem>
        Implemented real-time data transfer from Raspberry Pi hardware to a
        web-based visualizer using Supabase web sockets.
      </ListItem>
    </List>

    <InfoItem
      left="Portfolio Website"
      right={
        <a href="sa" className="text-accent hover:underline">
          GitHub
        </a>
      }
    >
      TypeScript, Tailwind, React
    </InfoItem>
    <List>
      <ListItem>
        Built a personal website with React to showcase technical and creative
        skills.
      </ListItem>
      <ListItem>
        Utilized <strong>Next.js</strong> for server-side rendering to deliver a
        fast and responsive user experience.
      </ListItem>
    </List>
  </Section>
);

const TechnicalSkills = () => (
  <Section title="Technical Skills">
    <List>
      <ListItem>
        <strong>Languages:</strong> TypeScript, JavaScript, HTML, CSS, Python,
        SQL, C#, Cypher
      </ListItem>
      <ListItem>
        <strong>Technologies:</strong> React, Nextjs, Node.js, Supabase, Redis,
        Tailwind
      </ListItem>
      <ListItem>
        <strong>Other:</strong> API Design, Relational Databases, Testing
      </ListItem>
    </List>
  </Section>
);

const Resume = () => {
  return (
    <Card className="max-w-4xl mx-auto p-4 bg-backgroundAlt">
      <CardHeader className="pb-0">
        <Header />
      </CardHeader>
      <CardContent>
        <Experience />
        <Education />
        <Projects />
        <TechnicalSkills />
      </CardContent>
    </Card>
  );
};

export default Resume;
