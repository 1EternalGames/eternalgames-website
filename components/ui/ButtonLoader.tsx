// components/ui/ButtonLoader.tsx
'use client';

import { motion } from 'framer-motion';

// SVG paths for the left and right loops of the infinity symbol
const leftLoopPath = "M 50 50 C 50 25, 25 25, 25 50 C 25 75, 50 75, 50 50";
const rightLoopPath = "M 50 50 C 50 25, 75 25, 75 50 C 75 75, 50 75, 50 50";

// Shared transition for a seamless, continuous loop
const transition = {
  duration: 1.5,
  ease: "easeInOut" as const,
  repeat: Infinity,
  repeatType: "loop" as const,
};

/**
 * The "Glyph Deconstruction" loader.
 * Animates the two halves of an infinity symbol, breaking them apart,
 * orbiting them, and reassembling them in a fluid loop.
 */
export default function ButtonLoader() {
  return (
    <motion.svg
      viewBox="0 0 100 100"
      width="24"
      height="24"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        stroke: "currentColor",
        strokeWidth: 8,
        fill: "none",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        overflow: "visible", // Prevents clipping during rotation
      }}
    >
      {/* Left loop of the infinity symbol */}
      <motion.path
        d={leftLoopPath}
        style={{ transformOrigin: "25px 50px" }} // Set rotation center to the loop's center
        animate={{
          rotate: [0, -180, -360],
          x: [0, -15, 0],
        }}
        transition={transition}
      />
      {/* Right loop of the infinity symbol */}
      <motion.path
        d={rightLoopPath}
        style={{ transformOrigin: "75px 50px" }} // Set rotation center to the loop's center
        animate={{
          rotate: [0, 180, 360],
          x: [0, 15, 0],
        }}
        transition={transition}
      />
    </motion.svg>
  );
}