import type { CSSProperties } from "react";

/** Horizontal anchor for hero floating windows inside `.hero-stage`. */
export type HeroWindowPosition = {
  /** Distance from top of hero-stage (px). */
  y: number;
  /** Distance from anchor edge (px) or CSS length (e.g. clamp). */
  x: number | string;
  /** `left` = to the right of the plate column; `right` = inset from stage right. */
  from?: "left" | "right";
};

/** Main entry window — right of plate, above the car. */
export const HERO_ENTRY_WINDOW: HeroWindowPosition = {
  from: "left",
  x: "clamp(16px, 52vw, 572px)",
  y: 108,
};

/** Insights hub stacks above the entry window. */
export const HERO_INSIGHTS_HUB_WINDOW: HeroWindowPosition = {
  from: "left",
  x: "clamp(16px, 52vw, 572px)",
  y: 52,
};

export const HERO_MODAL_DEFAULT: HeroWindowPosition = HERO_ENTRY_WINDOW;

export function resolveHeroWindowPlacement(
  pos: HeroWindowPosition,
  stackOffset = 0
): Pick<CSSProperties, "top" | "left" | "right"> {
  const top = pos.y + stackOffset;
  if (pos.from === "left") {
    const left =
      typeof pos.x === "number" ? pos.x + stackOffset : pos.x;
    return { top, left, right: "auto" };
  }
  const right =
    typeof pos.x === "number" ? pos.x + stackOffset : pos.x;
  return { top, right, left: "auto" };
}

/** Legacy `{ x, y }` right-anchored positions for chat modals. */
export function legacyRightPosition(
  position: { x: number; y: number },
  stackOffset = 0
): HeroWindowPosition {
  return { from: "right", x: position.x + stackOffset, y: position.y + stackOffset };
}
