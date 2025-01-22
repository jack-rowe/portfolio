"use client";

import { motion } from "framer-motion";

export default function Header() {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 120 }}
      className="p-6 border-b border-gray-700 bg-gray-900/80 backdrop-blur-md"
    >
      <nav className="container mx-auto">
        <motion.div whileHover={{ scale: 1.1 }} className="text-2xl font-bold">
          My Portfolio
        </motion.div>
      </nav>
    </motion.header>
  );
}
