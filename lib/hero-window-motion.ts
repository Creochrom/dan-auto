/** Shared premium floating-window entrance motion */
export const HERO_WINDOW_EASE = [0.22, 1, 0.36, 1] as const;

export const HERO_WINDOW_DURATION = 0.24;

export function heroWindowMotion(reduceMotion: boolean | null, entranceDelay = 0) {
  if (reduceMotion) {
    return {
      initial: { opacity: 1 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.12, delay: entranceDelay },
    };
  }
  return {
    initial: { opacity: 0, y: 10, scale: 0.96 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 6, scale: 0.97 },
    transition: { duration: HERO_WINDOW_DURATION, delay: entranceDelay, ease: HERO_WINDOW_EASE },
  };
}
