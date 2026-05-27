"use client";

import type { ReactNode } from "react";
import { useHorizontalDragScroll } from "@/hooks/useHorizontalDragScroll";

type Props = {
  children: ReactNode;
  className?: string;
  trackClassName?: string;
  centerOnDesktop?: boolean;
  "aria-label"?: string;
};

export function HeroDragScroll({
  children,
  className = "",
  trackClassName = "",
  centerOnDesktop = false,
  "aria-label": ariaLabel,
}: Props) {
  const { ref, isDragging, handlers } = useHorizontalDragScroll();

  return (
    <div className={className}>
      <div
        ref={ref}
        tabIndex={0}
        className={`hero-drag-scroll ${centerOnDesktop ? "hero-drag-scroll--center-desktop" : ""} ${trackClassName} ${isDragging ? "hero-drag-scroll--dragging" : ""}`}
        {...handlers}
        role="list"
        aria-label={ariaLabel}
      >
        {children}
      </div>
    </div>
  );
}
