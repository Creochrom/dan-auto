"use client";

import { motion, useReducedMotion } from "framer-motion";

export function HeroCinematic() {
  const reduce = useReducedMotion();

  return (
    <>
      <motion.div className="hero-mesh pointer-events-none absolute inset-0" />
      <motion.div className="workshop-lights pointer-events-none absolute inset-0" />
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-25" />
      <motion.div className="speed-lines speed-drift pointer-events-none absolute inset-0 opacity-14" />
      <motion.div className="workshop-floor pointer-events-none absolute inset-x-0 bottom-0 h-1/2" />
      <div className="vignette pointer-events-none absolute inset-0" />
      <div className="hero-light-streaks pointer-events-none absolute inset-0" aria-hidden />

      {/* Layered cinematic keys */}
      <motion.div
        className="pointer-events-none absolute -left-1/4 top-0 h-[70%] w-[70%] rounded-full bg-amber-500/10 blur-[140px]"
        animate={
          reduce ? undefined : { opacity: [0.14, 0.26, 0.14], scale: [1, 1.05, 1] }
        }
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -right-1/4 bottom-0 h-[55%] w-[55%] rounded-full bg-amber-700/12 blur-[120px]"
        animate={
          reduce ? undefined : { opacity: [0.1, 0.22, 0.1] }
        }
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <motion.div
        className="orb-float pointer-events-none absolute -top-32 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-amber-500/10 blur-[120px]"
        animate={
          reduce ? undefined : { opacity: [0.15, 0.32, 0.15] }
        }
        transition={{ duration: 10, repeat: Infinity }}
      />
      <motion.div
        className="pointer-events-none absolute right-0 top-1/4 h-96 w-96 rounded-full bg-amber-600/8 blur-[100px]"
        animate={
          reduce ? undefined : { opacity: [0.18, 0.38, 0.18] }
        }
        transition={{ duration: 7, repeat: Infinity }}
      />
      <motion.div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/35 to-transparent"
        aria-hidden
      />
      <motion.div
        className="pointer-events-none absolute inset-x-0 bottom-[28%] h-px bg-gradient-to-r from-transparent via-amber-500/12 to-transparent"
        aria-hidden
        animate={
          reduce ? undefined : { opacity: [0.25, 0.55, 0.25] }
        }
        transition={{ duration: 9, repeat: Infinity }}
      />
    </>
  );
}
