"use client";

import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import {
  HERO_WINDOW_EST_HEIGHT_PX,
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
  windowHeight = HERO_WINDOW_EST_HEIGHT_PX,
  defaultPosition,
  containerRef,
  freezePlacement = false,
}: {
  cascadeIndex: number;
  stackDepth: number;
  windowWidth: number;
  windowHeight?: number;
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
    const layerRect = container?.getBoundingClientRect();
    const header = document.querySelector("header.site-nav");
    const headerRect = header?.getBoundingClientRect();
    const ribbons = document.querySelector(".hero-info-ribbons");
    const ribbonsRect = ribbons?.getBoundingClientRect();
    const safeTopPad = nextTier === "mobile" ? 8 : 12;
    const safeBottomPad = nextTier === "mobile" ? 10 : 14;

    const layer = container && layerRect
      ? {
          width: container.clientWidth,
          height: container.clientHeight,
          top: layerRect.top,
          minTop: Math.max(
            0,
            Math.round((headerRect?.bottom ?? layerRect.top) - layerRect.top + safeTopPad)
          ),
          maxBottom: Math.max(
            HERO_WINDOW_EST_HEIGHT_PX,
            Math.round(
              Math.min(
                layerRect.bottom - safeBottomPad,
                (ribbonsRect?.top ?? layerRect.bottom) - safeBottomPad
              ) - layerRect.top
            )
          ),
        }
      : null;

    const nextPlacement = resolveFloatingWindowPlacement({
      tier: nextTier,
      cascadeIndex,
      stackDepth,
      windowWidth,
      windowHeight,
      defaultPosition: toHeroWindowPosition(defaultPosition),
      layer,
    });
    setPlacement(nextPlacement);
  }, [
    cascadeIndex,
    stackDepth,
    windowWidth,
    windowHeight,
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
