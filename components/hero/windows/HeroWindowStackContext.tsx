"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

type HeroWindowStackContextValue = {
  getCascadeIndex: (windowId: string) => number;
};

const HeroWindowStackContext = createContext<HeroWindowStackContextValue | null>(
  null
);

export function HeroWindowStackProvider({
  windowOrder,
  children,
}: {
  windowOrder: readonly string[];
  children: ReactNode;
}) {
  const indexById = useMemo(() => {
    const map = new Map<string, number>();
    windowOrder.forEach((id, index) => map.set(id, index));
    return map;
  }, [windowOrder]);

  const getCascadeIndex = useCallback(
    (windowId: string) => indexById.get(windowId) ?? 0,
    [indexById]
  );

  const value = useMemo(
    () => ({ getCascadeIndex }),
    [getCascadeIndex]
  );

  return (
    <HeroWindowStackContext.Provider value={value}>
      {children}
    </HeroWindowStackContext.Provider>
  );
}

export function useHeroWindowStackOptional(): HeroWindowStackContextValue | null {
  return useContext(HeroWindowStackContext);
}
