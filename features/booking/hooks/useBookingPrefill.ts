"use client";

import { useEffect, useState } from "react";
import {
  getBookingPrefill,
  getBookingPrefillRevision,
  subscribeBookingPrefill,
  type BookingPrefill,
} from "@/lib/booking-prefill";

export function useBookingPrefill(): {
  prefill: BookingPrefill;
  revision: number;
} {
  const [prefill, setPrefill] = useState<BookingPrefill>({});
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    setPrefill({ ...getBookingPrefill() });
    setRevision(getBookingPrefillRevision());
    return subscribeBookingPrefill(() => {
      setPrefill({ ...getBookingPrefill() });
      setRevision(getBookingPrefillRevision());
    });
  }, []);

  return { prefill, revision };
}
