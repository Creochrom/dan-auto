"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatPlate } from "@/lib/format-plate";

/**
 * Persisted booking customer fields only (localStorage).
 * Not used for service, date, notes, or advisor state.
 */

const STORAGE_KEY = "dan-auto:booking-customer";
const LEGACY_REG_KEY = "dan-auto:remembered-registration";

export type RememberedCustomer = {
  registration?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
};

export function readRememberedCustomer(): RememberedCustomer {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    let parsed: RememberedCustomer = raw ? (JSON.parse(raw) as RememberedCustomer) : {};

    const legacyReg = window.localStorage.getItem(LEGACY_REG_KEY);
    if (legacyReg && !parsed.registration) {
      parsed = { ...parsed, registration: legacyReg };
    }
    return parsed;
  } catch {
    return {};
  }
}

export function writeRememberedCustomer(patch: RememberedCustomer): void {
  if (typeof window === "undefined") return;
  try {
    const prev = readRememberedCustomer();
    const next: RememberedCustomer = { ...prev, ...patch };

    if (next.registration) {
      next.registration = formatPlate(next.registration);
    }

    const hasData = Boolean(
      next.registration?.trim() ||
        next.customerName?.trim() ||
        next.customerPhone?.trim() ||
        next.customerEmail?.trim()
    );

    if (!hasData) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

    if (next.registration) {
      window.localStorage.setItem(LEGACY_REG_KEY, next.registration);
    }
  } catch {
    /* noop */
  }
}

type UseRememberedCustomer = {
  customer: RememberedCustomer;
  hydrated: boolean;
  registrationFromMemory: boolean;
  patchCustomer: (patch: RememberedCustomer) => void;
};

export function useRememberedCustomer(): UseRememberedCustomer {
  const [customer, setCustomer] = useState<RememberedCustomer>({});
  const [hydrated, setHydrated] = useState(false);
  const [registrationFromMemory, setRegistrationFromMemory] = useState(false);
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const stored = readRememberedCustomer();
    if (stored.registration) {
      setRegistrationFromMemory(true);
    }
    setCustomer(stored);
    setHydrated(true);
  }, []);

  const patchCustomer = useCallback((patch: RememberedCustomer) => {
    setCustomer((prev) => {
      const next = { ...prev, ...patch };
      if (patch.registration !== undefined) {
        setRegistrationFromMemory(false);
      }
      writeRememberedCustomer(next);
      return next;
    });
  }, []);

  return { customer, hydrated, registrationFromMemory, patchCustomer };
}
