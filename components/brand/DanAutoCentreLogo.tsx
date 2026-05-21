"use client";

import Image from "next/image";
import Link from "next/link";

const LOGO_SRC = "/dan-auto-centre-logo.png";
const LOGO_WIDTH = 500;
const LOGO_HEIGHT = 133;

type DanAutoCentreLogoProps = {
  variant?: "nav" | "sm";
  className?: string;
  href?: string;
};

export function DanAutoCentreLogo({
  variant = "nav",
  className = "",
  href = "#",
}: DanAutoCentreLogoProps) {
  const heightClass =
    variant === "sm"
      ? "h-8 w-auto max-w-[150px]"
      : "h-[34px] w-auto lg:h-[44px]";

  const img = (
    <span
      className={`dan-logo-shimmer-wrap relative inline-flex max-w-[min(200px,38vw)] shrink-0 items-center sm:max-w-[220px] lg:max-w-[240px] ${className}`}
    >
      <Image
        src={LOGO_SRC}
        alt=""
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        priority={variant === "nav"}
        unoptimized
        className={`dan-centre-logo relative z-[1] block object-contain object-left ${heightClass}`}
        sizes="(max-width: 767px) 160px, (max-width: 1279px) 200px, 240px"
      />
      <span className="dan-logo-shimmer" aria-hidden />
    </span>
  );

  return (
    <Link
      href={href}
      className="group inline-flex shrink-0 items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a63c]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      aria-label="Dan Auto Centre — home"
    >
      {img}
    </Link>
  );
}
