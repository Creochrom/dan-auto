"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Lightweight client-side memory for the customer's most recent vehicle
 * registration plate. The hero plate scanner and the booking form share the
 * same value via this module so the user only types their plate once.
 *
 * Storage: localStorage (best-effort — silently no-ops if unavailable).
 * SSR: helpers are guarded; the hook always returns "" on the server pass and
 * hydrates from storage in a `useEffect` to avoid hydration mismatches.
 */

const STORAGE_KEY = "dan-auto:remembered-registration";

export function readRememberedRegistration(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function writeRememberedRegistration(value: string): void {
  if (typeof window === "undefined") return;
  try {
    if (value) {
      window.localStorage.setItem(STORAGE_KEY, value);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* noop */
  }
}

type UseRememberedRegistration = {
  /** Current registration. Empty string until the storage hydration effect runs. */
  value: string;
  /** Update the value. Persists to localStorage on every call. */
  setValue: (next: string) => void;
  /**
   * True when the *current* value was restored from localStorage on mount and
   * the user has not yet replaced it. Flips back to false the first time
   * `setValue` is called. Use this to render a one-shot "Registration
   * remembered" hint without showing it after fresh user input.
   */
  fromMemory: boolean;
};

export function useRememberedRegistration(): UseRememberedRegistration {
  const [value, setValueState] = useState("");
  const [fromMemory, setFromMemory] = useState(false);
  // Track whether we've completed the initial hydration so external setValue
  // calls during the same render cycle don't get clobbered by the effect.
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const stored = readRememberedRegistration();
    if (stored) {
      setValueState(stored);
      setFromMemory(true);
    }
  }, []);

  const setValue = useCallback((next: string) => {
    setValueState(next);
    setFromMemory(false);
    writeRememberedRegistration(next);
  }, []);

  return { value, setValue, fromMemory };
}
