import type { CSSProperties } from "react";
import {
  resolveHeroWindowPlacement,
  type HeroWindowPosition,
} from "@/lib/hero-window-position";

/** Chrome title bar height — cascade step matches this on mobile/tablet. */
export const HERO_WINDOW_TITLEBAR_PX = 40;

/** Estimated window height for viewport clamping before paint. */
export const HERO_WINDOW_EST_HEIGHT_PX = 300;

export type HeroViewportTier = "desktop" | "tablet" | "mobile";

export type LayerBounds = {
  width: number;
  height: number;
  top?: number;
  minTop?: number;
  maxBottom?: number;
};

export function getHeroViewportTier(viewportWidth: number): HeroViewportTier {
  if (viewportWidth >= 1280) return "desktop";
  if (viewportWidth >= 768) return "tablet";
  return "mobile";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(value, min));
}

export type StackPlacementInput = {
  cascadeIndex: number;
  windowWidth: number;
  layer: LayerBounds;
  tier: Exclude<HeroViewportTier, "desktop">;
  windowHeight?: number;
};

type StackTierConfig = {
  pad: number;
  topAnchor: number;
  minTop: number;
  cascadeStep: number;
};

function tierConfig(tier: Exclude<HeroViewportTier, "desktop">): StackTierConfig {
  if (tier === "mobile") {
    return { pad: 10, topAnchor: 20, minTop: 8, cascadeStep: 20 };
  }
  return { pad: 12, topAnchor: 28, minTop: 12, cascadeStep: 24 };
}

function usableLayerHeight(layer: LayerBounds, tier: Exclude<HeroViewportTier, "desktop">): number {
  if (typeof window === "undefined") return layer.height;

  const nav =
    parseInt(
      getComputedStyle(document.documentElement).getPropertyValue("--site-nav-height"),
      10
    ) || 92;
  const safePad = tier === "mobile" ? 12 : 16;
  const layerTop = typeof layer.top === "number" ? Math.max(0, layer.top) : nav;
  const ribbonGuard = tier === "mobile" ? 78 : 96;
  const viewportCap = window.innerHeight - layerTop - safePad - ribbonGuard;
  return Math.max(120, Math.min(layer.height, viewportCap));
}

function resolveVerticalBounds(
  layer: LayerBounds,
  tier: HeroViewportTier
): { minTop: number; maxBottom: number } {
  const fallbackMin = tier === "mobile" ? 8 : 12;
  const fallbackBottom = Math.max(140, layer.height - (tier === "mobile" ? 24 : 32));
  const minTop = clamp(
    typeof layer.minTop === "number" ? layer.minTop : fallbackMin,
    fallbackMin,
    Math.max(fallbackMin, layer.height - 120)
  );
  const maxBottom = clamp(
    typeof layer.maxBottom === "number" ? layer.maxBottom : fallbackBottom,
    minTop + 120,
    layer.height
  );
  return { minTop, maxBottom };
}

/**
 * Mobile/tablet stacked window positions — first window centered, each next
 * cascades up+right by title bar height; flips downward when top bound is hit.
 */
export function computeResponsiveStackPlacement({
  cascadeIndex,
  windowWidth,
  layer,
  tier,
  windowHeight = HERO_WINDOW_EST_HEIGHT_PX,
}: StackPlacementInput): Pick<
  CSSProperties,
  "top" | "left" | "right" | "width" | "maxWidth"
> {
  const { pad, topAnchor, minTop, cascadeStep } = tierConfig(tier);
  const usableH = usableLayerHeight(layer, tier);
  const bounds = resolveVerticalBounds(layer, tier);
  const safeMinTop = Math.max(minTop, bounds.minTop);
  const reservedBottom =
    tier === "mobile"
      ? Math.max(72, Math.min(120, Math.round(usableH * 0.17)))
      : Math.max(84, Math.min(148, Math.round(usableH * 0.2)));
  const maxPlayableHeight = Math.max(
    safeMinTop + 96,
    Math.min(bounds.maxBottom, usableH - reservedBottom)
  );

  const maxWidthRatio = tier === "mobile" ? 0.9 : 0.86;
  const winW = Math.min(
    windowWidth,
    Math.max(0, Math.floor(layer.width * maxWidthRatio) - pad * 2)
  );
  let top = topAnchor;
  let left = Math.max(pad, (layer.width - winW) / 2);

  for (let i = 0; i < cascadeIndex; i++) {
    const upTop = top - cascadeStep;
    if (upTop < safeMinTop) {
      top += cascadeStep;
    } else {
      top = upTop;
    }
    left += cascadeStep;
  }

  const maxLeft = Math.max(pad, layer.width - winW - pad);
  left = clamp(left, pad, maxLeft);

  const maxTop = Math.max(safeMinTop, maxPlayableHeight - windowHeight - pad);
  top = clamp(top, safeMinTop, maxTop);

  return {
    top,
    left,
    right: "auto",
    width: winW,
    maxWidth: `min(95vw, ${windowWidth}px)`,
  };
}

export type ResolvePlacementInput = {
  tier: HeroViewportTier;
  cascadeIndex: number;
  stackDepth: number;
  windowWidth: number;
  defaultPosition: HeroWindowPosition;
  layer: LayerBounds | null;
  windowHeight?: number;
};

function clampNumericSpawn(
  anchor: Pick<CSSProperties, "top" | "left" | "right">,
  windowWidth: number,
  windowHeight: number,
  layer: LayerBounds,
  tier: HeroViewportTier
): Pick<CSSProperties, "top" | "left" | "right"> {
  const pad = 12;
  const next = { ...anchor };
  const bounds = resolveVerticalBounds(layer, tier);

  if (typeof next.top === "number") {
    const minTop = Math.max(pad, bounds.minTop);
    const maxTop = Math.max(minTop, bounds.maxBottom - windowHeight - pad);
    next.top = clamp(next.top, minTop, maxTop);
  }

  if (typeof next.left === "number") {
    const maxLeft = Math.max(pad, layer.width - windowWidth - pad);
    next.left = clamp(next.left, pad, maxLeft);
  }

  if (typeof next.right === "number" && next.left === "auto") {
    const maxRight = Math.max(pad, layer.width - windowWidth - pad);
    next.right = clamp(next.right, pad, maxRight);
  }

  return next;
}

export function resolveFloatingWindowPlacement(
  input: ResolvePlacementInput
): Pick<CSSProperties, "top" | "left" | "right" | "width" | "maxWidth"> {
  const {
    tier,
    cascadeIndex,
    stackDepth,
    windowWidth,
    defaultPosition,
    layer,
    windowHeight = HERO_WINDOW_EST_HEIGHT_PX,
  } = input;

  if (tier === "desktop" || !layer || layer.width < 1) {
    const offset = stackDepth * 16;
    const anchor = resolveHeroWindowPlacement(defaultPosition, offset);
    const base = {
      ...anchor,
      width: windowWidth,
      maxWidth: `min(95vw, ${windowWidth}px)`,
    };
    if (tier === "desktop" && layer && layer.width >= 1) {
      return {
        ...base,
        ...clampNumericSpawn(base, windowWidth, windowHeight, layer, tier),
      };
    }
    return base;
  }

  return computeResponsiveStackPlacement({
    cascadeIndex,
    windowWidth,
    layer,
    tier,
    windowHeight,
  });
}
