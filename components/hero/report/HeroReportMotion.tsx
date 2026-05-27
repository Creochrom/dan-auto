"use client";

import type { ReactNode } from "react";

/** Legacy wrapper — motion lives on HeroFloatingWindow via entranceDelay. */
type Props = {
  children: ReactNode;
  delay?: number;
  className?: string;
};

export function HeroReportMotion({ children, className = "" }: Props) {
  return (
    <div className={`hero-report-motion-host ${className}`.trim()}>
      {children}
    </div>
  );
}
