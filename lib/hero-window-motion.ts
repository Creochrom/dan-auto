/** Shared premium floating-window entrance motion */
export const HERO_WINDOW_EASE = [0.22, 1, 0.36, 1] as const;

export const HERO_WINDOW_DURATION = 0.24;

export function heroWindowMotion(
  reduceMotion: boolean | null,
  entranceDelay = 0,
  tier: "desktop" | "tablet" | "mobile" = "desktop"
) {
  if (reduceMotion) {
    return {
      initial: { opacity: 1 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.12, delay: entranceDelay },
    };
  }

  const mobileLike = tier !== "desktop";
  const offsetY = mobileLike ? 6 : 10;
  const exitY = mobileLike ? 4 : 6;
  const startScale = mobileLike ? 0.985 : 0.96;
  const duration = mobileLike ? 0.28 : HERO_WINDOW_DURATION;

  return {
    initial: { opacity: 0, y: offsetY, scale: startScale },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: exitY, scale: 0.99 },
    transition: { duration, delay: entranceDelay, ease: HERO_WINDOW_EASE },
  };
}
