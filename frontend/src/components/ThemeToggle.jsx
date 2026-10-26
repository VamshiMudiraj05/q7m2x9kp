import React from "react";
import { motion } from "motion/react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle({ theme, onToggle, size = "md" }) {
  const isDark = theme === "dark";
  const width = size === "sm" ? 44 : 52;
  const height = size === "sm" ? 24 : 28;
  const knobSize = size === "sm" ? 18 : 22;
  const padding = (height - knobSize) / 2;

  return (
    <button
      onClick={onToggle}
      aria-label="Toggle dark mode"
      className="relative flex items-center rounded-full border border-black/10 dark:border-white/15 bg-black/[0.06] dark:bg-white/10 transition-colors duration-200 cursor-pointer focus:outline-none"
      style={{ width, height, padding }}
    >
      <motion.span
        className="flex items-center justify-center rounded-full bg-white dark:bg-[#232323] shadow-[0_2px_6px_rgba(0,0,0,0.2)]"
        style={{ width: knobSize, height: knobSize }}
        animate={{ x: isDark ? width - knobSize - padding * 2 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
      >
        {isDark ? (
          <Moon size={knobSize * 0.6} className="text-white/90" />
        ) : (
          <Sun size={knobSize * 0.6} className="text-[#E8A33D]" />
        )}
      </motion.span>
    </button>
  );
}
