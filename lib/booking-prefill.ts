/**
 * Transient booking prefill (in-memory, current tab only).
 * Not persisted — reload restores customer fields only, not service context.
 */

import { siteServices } from "@/lib/config/services";

export type BookingPrefill = {
  /** Canonical booking dropdown value (`siteServices[].bookLabel`). */
  service?: string;
  /** Marketing title for display hints (optional). */
  serviceLabel?: string;
  registration?: string;
  preferredDate?: string;
  preferredTime?: string;
  notes?: string;
};

let transientPrefill: BookingPrefill = {};
let revision = 0;
const listeners = new Set<() => void>();

function notify() {
  revision += 1;
  listeners.forEach((fn) => fn());
}

export function getBookingPrefill(): BookingPrefill {
  return transientPrefill;
}

export function getBookingPrefillRevision(): number {
  return revision;
}

export function subscribeBookingPrefill(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setBookingPrefill(next: BookingPrefill): void {
  transientPrefill = { ...next };
  notify();
}

export function mergeBookingPrefill(patch: BookingPrefill): void {
  transientPrefill = { ...transientPrefill, ...patch };
  notify();
}

export function clearBookingPrefill(): void {
  transientPrefill = {};
  notify();
}

/** Map CTA input (bookLabel, card title, or hero label) → canonical `bookLabel`. */
export function resolveBookLabel(input?: string): string | undefined {
  if (!input?.trim()) return undefined;
  const needle = input.trim();
  const lower = needle.toLowerCase();

  const exact = siteServices.find(
    (s) => s.bookLabel === needle || s.title === needle
  );
  if (exact) return exact.bookLabel;

  const fuzzy = siteServices.find((s) => {
    const bl = s.bookLabel.toLowerCase();
    const tl = s.title.toLowerCase();
    return (
      bl === lower ||
      tl === lower ||
      tl.includes(lower) ||
      lower.includes(bl) ||
      lower.includes(tl)
    );
  });
  return fuzzy?.bookLabel;
}

export function siteServiceTitleForBookLabel(bookLabel: string): string | undefined {
  return siteServices.find((s) => s.bookLabel === bookLabel)?.title;
}
