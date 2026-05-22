"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type AssistantContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  openAssistant: () => void;
  closeAssistant: () => void;
};

const AssistantContext = createContext<AssistantContextValue | null>(null);

const SCROLL_COLLAPSE_PX = 320;

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openedAtScroll = useRef(0);

  const openAssistant = useCallback(() => {
    openedAtScroll.current = typeof window !== "undefined" ? window.scrollY : 0;
    setOpen(true);
  }, []);

  const closeAssistant = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add("advisor-open");
    return () => document.body.classList.remove("advisor-open");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const scrolledSinceOpen = Math.abs(y - openedAtScroll.current);
      if (scrolledSinceOpen > SCROLL_COLLAPSE_PX && y - lastY > 6) {
        setOpen(false);
      }
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [open]);

  const value = useMemo(
    () => ({ open, setOpen, openAssistant, closeAssistant }),
    [open, openAssistant, closeAssistant]
  );

  return (
    <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>
  );
}

export function useAssistant() {
  const ctx = useContext(AssistantContext);
  if (!ctx) {
    throw new Error("useAssistant must be used within AssistantProvider");
  }
  return ctx;
}

export function useAssistantOptional() {
  return useContext(AssistantContext);
}
