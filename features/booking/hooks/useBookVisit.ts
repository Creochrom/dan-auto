"use client";

import { useCallback } from "react";
import { localIsoDate } from "@/lib/date";
import { formatPlate } from "@/lib/format-plate";
import {
  mergeBookingPrefill,
  resolveBookLabel,
  siteServiceTitleForBookLabel,
  type BookingPrefill,
} from "@/lib/booking-prefill";
import { writeRememberedCustomer } from "@/lib/booking-customer-memory";
import { scrollToSection } from "@/lib/scroll-to-section";

export type BookVisitOptions = {
  scroll?: boolean;
  /** When true, sets preferredDate to today if not already in the patch. */
  preferToday?: boolean;
};

export function useBookVisit() {
  const bookVisit = useCallback(
    (partial?: BookingPrefill, options?: BookVisitOptions) => {
      const patch: BookingPrefill = { ...(partial ?? {}) };

      const resolved = resolveBookLabel(patch.service ?? patch.serviceLabel);
      if (resolved) {
        patch.service = resolved;
        if (!patch.serviceLabel) {
          patch.serviceLabel = siteServiceTitleForBookLabel(resolved);
        }
      }

      if (options?.preferToday && !patch.preferredDate) {
        patch.preferredDate = localIsoDate(0);
      }

      if (patch.registration) {
        patch.registration = formatPlate(patch.registration);
        writeRememberedCustomer({ registration: patch.registration });
      }

      mergeBookingPrefill(patch);

      if (options?.scroll !== false) {
        scrollToSection("booking");
      }
    },
    []
  );

  return bookVisit;
}
