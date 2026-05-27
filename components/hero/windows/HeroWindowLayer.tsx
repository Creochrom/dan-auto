"use client";

import type { ReactNode } from "react";

type Props = {
  active: boolean;
  children: ReactNode;
};

/** Renders children when active. Parent must carry `ref={layerRef}` + `.hero-window-layer`. */
export function HeroWindowLayer({ active, children }: Props) {
  if (!active) return null;
  return <>{children}</>;
}
