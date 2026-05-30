/** One-way travel time (e.g. left → right) in milliseconds. */
export const HERO_RIBBON_TRAVEL_MS = 25_000;

export type HeroRibbonAutoMotion = "forward" | "reverse";

/** Maps cycle phase (0→2) to scroll offset for smooth ping-pong motion. */
export function heroRibbonScrollLeftForPhase(
  cyclePhase: number,
  maxScroll: number,
  mode: HeroRibbonAutoMotion
): number {
  if (maxScroll <= 0) return 0;

  const wrapped = ((cyclePhase % 2) + 2) % 2;
  const forwardProgress = (1 - Math.cos(Math.PI * wrapped)) / 2;
  const reverseProgress = 1 - forwardProgress;

  return (mode === "forward" ? forwardProgress : reverseProgress) * maxScroll;
}

/** Re-align animation phase after manual scroll so motion resumes smoothly. */
export function heroRibbonPhaseForScrollLeft(
  scrollLeft: number,
  maxScroll: number,
  mode: HeroRibbonAutoMotion,
  currentPhase = 0
): number {
  if (maxScroll <= 0) return 0;

  const forwardProgress = Math.max(
    0,
    Math.min(1, mode === "forward" ? scrollLeft / maxScroll : 1 - scrollLeft / maxScroll)
  );
  const primary = Math.acos(1 - 2 * forwardProgress) / Math.PI;
  const alternate = 2 - primary;
  const wrappedCurrent = ((currentPhase % 2) + 2) % 2;

  return Math.abs(wrappedCurrent - primary) <= Math.abs(wrappedCurrent - alternate)
    ? primary
    : alternate;
}
