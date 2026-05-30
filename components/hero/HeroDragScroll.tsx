"use client";

import type { ReactNode } from "react";
import { useHorizontalAutoScroll } from "@/hooks/useHorizontalAutoScroll";
import { useHorizontalDragScroll } from "@/hooks/useHorizontalDragScroll";
import type { HeroRibbonAutoMotion } from "@/lib/hero-auto-scroll";

type Props = {
  children: ReactNode;
  className?: string;
  trackClassName?: string;
  centerOnDesktop?: boolean;
  autoMotion?: HeroRibbonAutoMotion;
  "aria-label"?: string;
};

export function HeroDragScroll({
  children,
  className = "",
  trackClassName = "",
  centerOnDesktop = false,
  autoMotion,
  "aria-label": ariaLabel,
}: Props) {
  const { ref, isDragging, handlers } = useHorizontalDragScroll();
  const { isAutoActive } = useHorizontalAutoScroll(ref, autoMotion, { isDragging });

  return (
    <div className={className}>
      <div
        ref={ref}
        tabIndex={0}
        className={`hero-drag-scroll ${centerOnDesktop ? "hero-drag-scroll--center-desktop" : ""} ${trackClassName} ${isDragging ? "hero-drag-scroll--dragging" : ""} ${isAutoActive ? "hero-drag-scroll--auto-motion" : ""}`}
        {...handlers}
        role="list"
        aria-label={ariaLabel}
      >
        {children}
      </div>
    </div>
  );
}
