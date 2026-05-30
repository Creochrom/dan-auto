"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
/** Stacking within `.hero-window-layer` (layer 4 — relative offsets inside --hero-z-cards). */
const HERO_WINDOW_Z_BASE = 10;

type HeroWindowManagerValue = {
  layerRef: RefObject<HTMLDivElement | null>;
  registerWindow: (windowId: string) => void;
  unregisterWindow: (windowId: string) => void;
  bringToFront: (windowId: string) => void;
  getZIndex: (windowId: string) => number;
};

const HeroWindowManagerContext = createContext<HeroWindowManagerValue | null>(
  null
);

export function HeroWindowManagerProvider({ children }: { children: ReactNode }) {
  const layerRef = useRef<HTMLDivElement | null>(null);
  const zCounterRef = useRef(HERO_WINDOW_Z_BASE);
  const [zByWindowId, setZByWindowId] = useState<Map<string, number>>(
    () => new Map()
  );

  const assignTopZ = useCallback((windowId: string) => {
    zCounterRef.current += 1;
    const nextZ = zCounterRef.current;
    setZByWindowId((prev) => {
      const next = new Map(prev);
      next.set(windowId, nextZ);
      return next;
    });
    return nextZ;
  }, []);

  const registerWindow = useCallback(
    (windowId: string) => {
      assignTopZ(windowId);
    },
    [assignTopZ]
  );

  const unregisterWindow = useCallback((windowId: string) => {
    setZByWindowId((prev) => {
      if (!prev.has(windowId)) return prev;
      const next = new Map(prev);
      next.delete(windowId);
      return next;
    });
  }, []);

  const bringToFront = useCallback(
    (windowId: string) => {
      setZByWindowId((prev) => {
        if (!prev.has(windowId)) return prev;
        zCounterRef.current += 1;
        const next = new Map(prev);
        next.set(windowId, zCounterRef.current);
        return next;
      });
    },
    []
  );

  const getZIndex = useCallback(
    (windowId: string) => zByWindowId.get(windowId) ?? HERO_WINDOW_Z_BASE,
    [zByWindowId]
  );

  const value = useMemo(
    () => ({
      layerRef,
      registerWindow,
      unregisterWindow,
      bringToFront,
      getZIndex,
    }),
    [registerWindow, unregisterWindow, bringToFront, getZIndex]
  );

  return (
    <HeroWindowManagerContext.Provider value={value}>
      {children}
    </HeroWindowManagerContext.Provider>
  );
}

export function useHeroWindowManager(): HeroWindowManagerValue {
  const ctx = useContext(HeroWindowManagerContext);
  if (!ctx) {
    throw new Error(
      "useHeroWindowManager must be used within HeroWindowManagerProvider"
    );
  }
  return ctx;
}

/** Optional hook for components that may render outside the provider. */
export function useHeroWindowManagerOptional(): HeroWindowManagerValue | null {
  return useContext(HeroWindowManagerContext);
}
