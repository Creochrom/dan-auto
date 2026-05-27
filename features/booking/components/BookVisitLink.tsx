"use client";

import type { MouseEvent, ReactNode } from "react";
import { useBookVisit } from "@/features/booking/hooks/useBookVisit";
import { handleSectionNavClick } from "@/lib/scroll-to-section";
import type { BookingPrefill } from "@/lib/booking-prefill";

type Props = {
  children: ReactNode;
  className?: string;
  prefill?: BookingPrefill;
  onAfterNavigate?: () => void;
};

/** Hash link that routes booking navigation through `useBookVisit`. */
export function BookVisitLink({
  children,
  className,
  prefill,
  onAfterNavigate,
}: Props) {
  const bookVisit = useBookVisit();

  return (
    <a
      href="#booking"
      className={className}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        handleSectionNavClick(e, "#booking", () => {
          bookVisit(prefill, { scroll: false });
          onAfterNavigate?.();
        });
      }}
    >
      {children}
    </a>
  );
}
