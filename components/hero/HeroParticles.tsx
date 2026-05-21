"use client";

import { motion, useReducedMotion } from "framer-motion";

const PARTICLES = [
  { left: "8%", top: "18%", size: 1.5, delay: 0, duration: 4.2 },
  { left: "22%", top: "42%", size: 1, delay: 0.8, duration: 5.1 },
  { left: "78%", top: "12%", size: 2, delay: 0.3, duration: 4.8 },
  { left: "88%", top: "38%", size: 1.2, delay: 1.2, duration: 5.5 },
  { left: "52%", top: "8%", size: 1, delay: 2, duration: 4.4 },
  { left: "65%", top: "55%", size: 1.8, delay: 0.5, duration: 5.2 },
  { left: "35%", top: "68%", size: 1.1, delay: 1.5, duration: 4.9 },
  { left: "92%", top: "72%", size: 1.4, delay: 0.2, duration: 5.8 },
  { left: "12%", top: "78%", size: 1, delay: 2.2, duration: 4.6 },
  { left: "45%", top: "28%", size: 0.8, delay: 1.8, duration: 5.4 },
  { left: "72%", top: "88%", size: 1.3, delay: 0.9, duration: 4.7 },
  { left: "58%", top: "42%", size: 1, delay: 2.5, duration: 6 },
] as const;

export function HeroParticles() {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <div className="hero-particles pointer-events-none absolute inset-0 overflow-hidden opacity-25" aria-hidden />
    );
  }

  return (
    <div
      className="hero-particles pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {PARTICLES.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-amber-300/30 shadow-[0_0_14px_rgba(232,197,71,0.28)]"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
          }}
          animate={{
            opacity: [0.12, 0.48, 0.12],
            scale: [1, 1.35, 1],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
      <motion.div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 22% 28%, rgba(232,197,71,0.85) 0%, transparent 42%), radial-gradient(circle at 78% 72%, rgba(201,162,39,0.65) 0%, transparent 38%)",
        }}
        animate={{ opacity: [0.028, 0.048, 0.028] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
