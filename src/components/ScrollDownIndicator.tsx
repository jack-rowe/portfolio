import { ArrowDown } from "lucide-react";
import { motion } from "motion/react";
import { useState, useEffect } from "react";

export const ScrollDownIndicator = () => {
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

  if (isBottom) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-8 left-0 right-0 text-center z-[999]"
    >
      <div className="inline-block animate-bounce">
        <div className="flex flex-col items-center justify-center gap-2 text-white/50 text-xs">
          <span>SCROLL DOWN</span>
          <ArrowDown className="text-gray-400" size={24} />
        </div>
      </div>
    </motion.div>
  );
};
