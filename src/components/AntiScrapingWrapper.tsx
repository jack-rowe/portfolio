import { motion } from "framer-motion";
import React, { ReactNode, useState } from "react";

interface AntiScrapingWrapperProps {
  children: ReactNode;
  placeholder?: string;
  className?: string;
  revealedClassName?: string;
  placeholderClassName?: string;
}

export const AntiScrapingWrapper: React.FC<AntiScrapingWrapperProps> = ({
  children,
  placeholder = "Click to reveal",
  className = "",
  revealedClassName = "",
  placeholderClassName = "",
}) => {
  const [isRevealed, setIsRevealed] = useState(false);

  const handleClick = () => {
    setIsRevealed(true);
  };

  if (isRevealed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`${className} ${revealedClassName}`.trim()}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.button
      className={`cursor-pointer select-none relative overflow-hidden ${className} ${placeholderClassName}`.trim()}
      onClick={handleClick}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label="Click to reveal hidden content"
      whileHover="hover"
      initial="initial"
    >
      {/* Hidden content preview that shows on hover */}
      <motion.div
        className="absolute inset-0 z-0"
        variants={{
          initial: { opacity: 0, filter: "blur(8px)", scale: 0.95 },
          hover: { opacity: 0.3, filter: "blur(4px)", scale: 1 },
        }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      ></motion.div>

      {/* Overlay with reveal button */}
      <motion.div
        className="relative z-10 bg-white/5 backdrop-blur-lg rounded-lg border border-white/10 hover:border-emerald-400/30 transition-colors duration-300"
        variants={{
          initial: { backgroundColor: "rgba(255, 255, 255, 0.05)" },
          hover: { backgroundColor: "rgba(255, 255, 255, 0.08)" },
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-center gap-2 px-4 py-2 text-gray-400 hover:text-emerald-400 transition-colors duration-300">
          <span className="text-sm font-medium">{placeholder}</span>
        </div>
      </motion.div>
    </motion.button>
  );
};
