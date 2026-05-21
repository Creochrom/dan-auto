"use client";

import { motion } from "framer-motion";
import { useId } from "react";

type DanAutoLogoProps = {
  size?: "sm" | "md" | "nav" | "lg";
  showWordmark?: boolean;
  className?: string;
};

const SIZES = {
  sm: {
    brand: "text-[12px]",
    city: "text-[7px]",
    tracking: "tracking-[0.22em]",
  },
  md: {
    brand: "text-[13px] sm:text-[14px]",
    city: "text-[8px] sm:text-[8px]",
    tracking: "tracking-[0.26em]",
  },
  nav: {
    brand: "text-[14px] font-bold tracking-[0.06em]",
    city: "text-[9px]",
    tracking: "tracking-[0.28em]",
  },
  lg: {
    brand: "text-[15px] sm:text-[16px]",
    city: "text-[9px]",
    tracking: "tracking-[0.3em]",
  },
} as const;

const BOX = {
  sm: "h-9 w-9",
  md: "h-10 w-10",
  nav: "h-[42px] w-[42px]",
  lg: "h-11 w-11 sm:h-12 sm:w-12",
} as const;

/** Blueprint: circular gold DA seal + stacked “DAN AUTO” / “SOUTHAMPTON” wordmark beside it. */
export function DanAutoLogo({
  size = "md",
  showWordmark = true,
  className = "",
}: DanAutoLogoProps) {
  const s = SIZES[size];
  const box = BOX[size];
  const reactId = useId().replace(/:/g, "");
  const uid = `lg-${reactId}`;

  return (
    <div
      className={`group flex min-w-0 items-center ${size === "nav" ? "gap-3" : "gap-2 sm:gap-2.5"} ${className}`}
    >
      <motion.span
        whileHover={{ scale: 1.035 }}
        whileTap={{ scale: 0.988 }}
        className={`relative flex ${box} shrink-0 items-center justify-center`}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full drop-shadow-[0_2px_26px_rgba(201,162,39,0.38)]"
          aria-hidden
        >
          <defs>
            <linearGradient id={`${uid}-gold`} x1="12%" y1="4%" x2="88%" y2="96%">
              <stop offset="0%" stopColor="#fff9e6" />
              <stop offset="22%" stopColor="#f5e0a3" />
              <stop offset="48%" stopColor="#c9a227" />
              <stop offset="72%" stopColor="#e8c547" />
              <stop offset="100%" stopColor="#5c4a14" />
            </linearGradient>
          </defs>

          {/* Outer ring — circular workshop seal */}
          <circle
            cx="24"
            cy="24"
            r="21"
            fill="#090909"
            stroke={`url(#${uid}-gold)`}
            strokeWidth="1"
          />

          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <line
              key={deg}
              x1="24"
              y1="5.5"
              x2="24"
              y2="7.8"
              stroke={`url(#${uid}-gold)`}
              strokeWidth="1.05"
              strokeLinecap="round"
              opacity="0.55"
              transform={`rotate(${deg} 24 24)`}
            />
          ))}

          <circle
            cx="24"
            cy="24"
            r="13.8"
            fill="#060606"
            stroke={`url(#${uid}-gold)`}
            strokeWidth="0.35"
          />
          {[0, 45, 90, 135].map((deg) => (
            <line
              key={deg}
              x1="24"
              y1="12"
              x2="24"
              y2="14.8"
              stroke={`url(#${uid}-gold)`}
              strokeWidth="0.4"
              strokeLinecap="round"
              opacity="0.42"
              transform={`rotate(${deg} 24 24)`}
            />
          ))}
          <text
            x="24"
            y="29"
            textAnchor="middle"
            fill={`url(#${uid}-gold)`}
            style={{
              fontFamily: "var(--font-outfit), system-ui, sans-serif",
              fontSize:
                size === "sm"
                  ? "10px"
                  : size === "md"
                    ? "11px"
                    : size === "nav"
                      ? "12px"
                      : "12px",
              fontWeight: 800,
              letterSpacing: "-0.06em",
            }}
          >
            DA
          </text>
        </svg>
      </motion.span>

      {showWordmark && (
        <div className="min-w-0 leading-tight">
          <p
            className={`${s.brand} leading-none font-bold uppercase tracking-[0.14em] text-white`}
          >
            DAN AUTO
          </p>
          <p
            className={`${s.city} mt-1 font-medium uppercase ${s.tracking} text-[#d4a63c]/90`}
          >
            Southampton
          </p>
        </div>
      )}
    </div>
  );
}
