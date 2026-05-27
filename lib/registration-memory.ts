"use client";

/**
 * @deprecated Use `lib/booking-customer-memory` — registration is part of remembered customer.
 */

import {
  readRememberedCustomer,
  writeRememberedCustomer,
  useRememberedCustomer,
} from "@/lib/booking-customer-memory";

export function readRememberedRegistration(): string {
  return readRememberedCustomer().registration ?? "";
}

export function writeRememberedRegistration(value: string): void {
  writeRememberedCustomer({ registration: value });
}

export function useRememberedRegistration() {
  const { customer, hydrated, registrationFromMemory, patchCustomer } =
    useRememberedCustomer();

  return {
    value: customer.registration ?? "",
    fromMemory: hydrated && registrationFromMemory,
    setValue: (next: string) => patchCustomer({ registration: next }),
  };
}
