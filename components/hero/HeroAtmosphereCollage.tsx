"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  HERO_LAYER_BRAKE,
  HERO_LAYER_CARBON,
  HERO_LAYER_HEADLIGHT,
  HERO_LAYER_SILHOUETTE,
  HERO_LAYER_TOOLS,
} from "@/lib/vehicle-data";

const EASE = [0.22, 1, 0.36, 1] as const;

type Props = {
  reducedMotion?: boolean;
};

/**
 * Layered luxury workshop atmosphere — abstract detail, texture, silhouette only.
 */
export function HeroAtmosphereCollage({ reducedMotion }: Props) {
  return (
    <div className="hero-atmosphere-collage relative mx-auto h-full min-h-[520px] w-full max-w-xl">
      <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-br from-white/[0.04] via-transparent to-transparent ring-1 ring-white/[0.06]" />
      <div className="pointer-events-none absolute -inset-px rounded-[2rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_40px_120px_rgba(0,0,0,0.85)]" />

      <motion.div
        className="absolute inset-x-[-12%] bottom-[-8%] top-[18%]"
        animate={
          reducedMotion ? undefined : { opacity: [0.32, 0.46, 0.32] }
        }
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      >
        <Image
          src={HERO_LAYER_SILHOUETTE}
          alt=""
          fill
          sizes="600px"
          loading="lazy"
          className="object-cover object-[center_70%] opacity-[0.2] saturate-0 contrast-125 blur-md"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/92" />
      </motion.div>

      <motion.div
        className="absolute left-[4%] top-[12%] h-[42%] w-[48%] overflow-hidden rounded-2xl ring-1 ring-amber-500/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 1 }}
      >
        <Image
          src={HERO_LAYER_CARBON}
          alt=""
          fill
          sizes="300px"
          loading="lazy"
          className="object-cover opacity-[0.36] mix-blend-overlay saturate-50"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/65 via-transparent to-amber-950/35" />
      </motion.div>

      <motion.div
        className="absolute right-0 top-[8%] h-[38%] w-[52%] overflow-hidden rounded-2xl ring-1 ring-white/[0.07]"
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.85, ease: EASE }}
      >
        <Image
          src={HERO_LAYER_HEADLIGHT}
          alt=""
          fill
          sizes="320px"
          loading="lazy"
          className="object-cover object-[70%_center] opacity-[0.42] saturate-[0.8] contrast-110"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-l from-black via-black/45 to-transparent" />
        {!reducedMotion && (
          <motion.div
            className="absolute inset-y-[35%] right-[18%] w-px bg-gradient-to-b from-transparent via-amber-400/55 to-transparent"
            animate={{ opacity: [0.25, 0.9, 0.25] }}
            transition={{ duration: 3.5, repeat: Infinity }}
          />
        )}
      </motion.div>

      <motion.div
        className="absolute bottom-[26%] left-[8%] h-[28%] w-[44%] overflow-hidden rounded-2xl ring-1 ring-amber-500/15"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.62, duration: 0.75, ease: EASE }}
      >
        <Image
          src={HERO_LAYER_BRAKE}
          alt=""
          fill
          sizes="280px"
          loading="lazy"
          className="object-cover object-center opacity-[0.4] saturate-[0.72]"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-transparent to-black/45" />
      </motion.div>

      <motion.div
        className="absolute bottom-[6%] right-[6%] h-[22%] w-[56%] overflow-hidden rounded-2xl ring-1 ring-white/[0.05]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.75, duration: 0.8 }}
      >
        <Image
          src={HERO_LAYER_TOOLS}
          alt=""
          fill
          sizes="340px"
          loading="lazy"
          className="object-cover object-[center_60%] opacity-[0.3] saturate-50 blur-[1px]"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/55 to-transparent" />
      </motion.div>

      <motion.div
        className="pointer-events-none absolute inset-0 rounded-[2rem]"
        style={{
          background:
            "linear-gradient(115deg, transparent 38%, rgba(232,197,71,0.08) 49%, transparent 62%)",
        }}
        animate={
          reducedMotion ? undefined : { opacity: [0.22, 0.52, 0.22] }
        }
        transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="pointer-events-none absolute inset-0 rounded-[2rem] shadow-[inset_0_0_100px_rgba(0,0,0,0.88)]" />
    </div>
  );
}
