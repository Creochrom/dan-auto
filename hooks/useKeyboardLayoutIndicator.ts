"use client";

import { useCallback, useEffect, useState } from "react";
import {
  hintFromTypedChar,
  inferLayoutFromKeyboardApi,
  inferLayoutFromLanguages,
  type KeyboardLayoutHint,
} from "@/lib/keyboard-layout";

export type { KeyboardLayoutHint };

export function useKeyboardLayoutIndicator() {
  const [layout, setLayout] = useState<KeyboardLayoutHint>(() => inferLayoutFromLanguages());

  useEffect(() => {
    let cancelled = false;
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
