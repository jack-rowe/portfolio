import { motion } from "motion/react";

export function Section({
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
