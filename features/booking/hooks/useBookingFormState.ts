"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { bookingServiceOptions } from "@/lib/config/services";
import { localIsoDate } from "@/lib/date";
import { formatPlate, stripPlate } from "@/lib/format-plate";
import {
  readRememberedCustomer,
  writeRememberedCustomer,
} from "@/lib/booking-customer-memory";
import {
  getBookingPrefill,
  type BookingPrefill,
} from "@/lib/booking-prefill";

const DEFAULT_SERVICE = bookingServiceOptions[0] ?? "MOT";

type FormFields = {
  service: string;
  date: string;
  time: string;
  registration: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  notes: string;
};

function applyTransientPrefill(
  current: FormFields,
  prefill: BookingPrefill,
  opts: { preserveCustomer: boolean }
): FormFields {
  const next = { ...current };

  if (prefill.service) next.service = prefill.service;
  if (prefill.preferredDate) next.date = prefill.preferredDate;
  if (prefill.preferredTime) next.time = prefill.preferredTime;
  if (prefill.registration) next.registration = formatPlate(prefill.registration);
  if (prefill.notes !== undefined && prefill.notes !== "") {
    next.notes = prefill.notes;
  }

  if (!opts.preserveCustomer) {
    return next;
  }

  return next;
}

export function useBookingFormState(prefillRevision: number) {
  const [mounted, setMounted] = useState(false);
  const [showRegHint, setShowRegHint] = useState(false);
  const dismissRegHint = useCallback(() => setShowRegHint(false), []);
  const initialHydrated = useRef(false);
  const lastRevision = useRef(-1);

  const [fields, setFields] = useState<FormFields>({
    service: DEFAULT_SERVICE,
    date: "",
    time: "",
    registration: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    notes: "",
  });

  useEffect(() => {
    setMounted(true);
    setFields((prev) => ({
      ...prev,
      date: prev.date || localIsoDate(0),
    }));
  }, []);

  useEffect(() => {
    if (!mounted || initialHydrated.current) return;
    initialHydrated.current = true;

    const remembered = readRememberedCustomer();
    setFields((prev) => ({
      ...prev,
      registration: remembered.registration
        ? formatPlate(remembered.registration)
        : prev.registration,
      customerName: remembered.customerName ?? prev.customerName,
      customerPhone: remembered.customerPhone ?? prev.customerPhone,
      customerEmail: remembered.customerEmail ?? prev.customerEmail,
    }));
    if (remembered.registration) setShowRegHint(true);
  }, [mounted]);

  useEffect(() => {
    if (!mounted || prefillRevision === lastRevision.current) return;
    lastRevision.current = prefillRevision;

    const prefill = getBookingPrefill();
    if (Object.keys(prefill).length === 0) return;

    setFields((prev) =>
      applyTransientPrefill(prev, prefill, { preserveCustomer: true })
    );
    if (prefill.registration) setShowRegHint(false);
  }, [prefillRevision, mounted]);

  const persistCustomer = useCallback((snapshot: FormFields) => {
      writeRememberedCustomer({
        registration: stripPlate(snapshot.registration) || undefined,
        customerName: snapshot.customerName.trim() || undefined,
        customerPhone: snapshot.customerPhone.trim() || undefined,
        customerEmail: snapshot.customerEmail.trim() || undefined,
      });
  }, []);

  const updateField = useCallback(
    <K extends keyof FormFields>(key: K, value: FormFields[K]) => {
      setFields((prev) => {
        const next = { ...prev, [key]: value };
        if (
          key === "registration" ||
          key === "customerName" ||
          key === "customerPhone" ||
          key === "customerEmail"
        ) {
          if (key === "registration") dismissRegHint();
          persistCustomer(next);
        }
        return next;
      });
    },
    [persistCustomer, dismissRegHint]
  );

  const updateRegistration = useCallback(
    (value: string) => {
      dismissRegHint();
      updateField("registration", formatPlate(value));
    },
    [updateField, dismissRegHint]
  );

  return {
    mounted,
    showRegHint,
    dismissRegHint,
    fields,
    updateField,
    updateRegistration,
    persistCustomer,
  };
}
