"use client";

import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import {
  getHeroViewportTier,
  resolveFloatingWindowPlacement,
  type HeroViewportTier,
} from "@/lib/hero-window-stack-position";
import type { HeroWindowPosition } from "@/lib/hero-window-position";

type LegacyPosition = { x: number; y: number };

function toHeroWindowPosition(
  defaultPosition: LegacyPosition | HeroWindowPosition
): HeroWindowPosition {
  if ("from" in defaultPosition || typeof defaultPosition.x === "string") {
    return defaultPosition;
  }
  return { from: "right", x: defaultPosition.x, y: defaultPosition.y };
}

export function useHeroFloatingWindowPlacement({
  cascadeIndex,
  stackDepth,
  windowWidth,
  defaultPosition,
  containerRef,
  freezePlacement = false,
}: {
  cascadeIndex: number;
  stackDepth: number;
  windowWidth: number;
  defaultPosition: LegacyPosition | HeroWindowPosition;
  containerRef?: RefObject<HTMLElement | null>;
  /** When true, stop recomputing spawn position (user has dragged). */
  freezePlacement?: boolean;
}) {
  const [tier, setTier] = useState<HeroViewportTier>("desktop");
  const [placement, setPlacement] = useState<
    Pick<CSSProperties, "top" | "left" | "right" | "width" | "maxWidth">
  >(() => ({
    top: 0,
    left: 0,
    right: "auto",
    width: windowWidth,
    maxWidth: `min(95vw, ${windowWidth}px)`,
  }));

  const recompute = useCallback(() => {
    if (freezePlacement) return;

    const nextTier = getHeroViewportTier(window.innerWidth);
    setTier(nextTier);

    const container = containerRef?.current;
    const layer = container
      ? {
          width: container.clientWidth,
          height: container.clientHeight,
          top: container.getBoundingClientRect().top,
        }
      : null;

    const nextPlacement = resolveFloatingWindowPlacement({
      tier: nextTier,
      cascadeIndex,
      stackDepth,
      windowWidth,
      defaultPosition: toHeroWindowPosition(defaultPosition),
      layer,
    });
    setPlacement(nextPlacement);
  }, [
    cascadeIndex,
    stackDepth,
    windowWidth,
    defaultPosition,
    containerRef,
    freezePlacement,
  ]);

  useEffect(() => {
    recompute();
    window.addEventListener("resize", recompute);

    const container = containerRef?.current;
    if (!container || typeof ResizeObserver === "undefined") {
      return () => window.removeEventListener("resize", recompute);
    }

    const observer = new ResizeObserver(() => recompute());
    observer.observe(container);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", recompute);
    };
  }, [recompute, containerRef]);

  return { tier, placement };
}
