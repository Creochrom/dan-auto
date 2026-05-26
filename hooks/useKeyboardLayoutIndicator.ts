"use client";

import { useCallback, useEffect, useState } from "react";
import {
  hintFromTypedChar,
  inferLayoutFromKeyboardApi,
  inferLayoutFromLanguages,
  type KeyboardLayoutHint,
} from "@/lib/keyboard-layout";

export type { KeyboardLayoutHint };

// IMPORTANT: must be deterministic across server and client to avoid a
// hydration mismatch. Node 22+ exposes a global `navigator` whose
// `languages` reflects the host OS locale, which can differ from the
// visitor's browser locale (e.g. server="ru", client="en"). Any such
// mismatch breaks React hydration, which in turn freezes framer-motion
// `whileInView` sections at their `opacity: 0` initial state. We render
// a fixed default on first paint and refine after mount.
const SSR_SAFE_DEFAULT: KeyboardLayoutHint = "en";

export function useKeyboardLayoutIndicator() {
  const [layout, setLayout] = useState<KeyboardLayoutHint>(SSR_SAFE_DEFAULT);

  useEffect(() => {
    let cancelled = false;

    const fromLanguages = inferLayoutFromLanguages();
    if (fromLanguages !== SSR_SAFE_DEFAULT) {
      setLayout(fromLanguages);
    }

    void inferLayoutFromKeyboardApi().then((hint) => {
      if (!cancelled && hint) setLayout(hint);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const observeKey = useCallback((key: string) => {
    const hint = hintFromTypedChar(key);
    if (hint) setLayout(hint);
  }, []);

  return { layout, observeKey };
}
