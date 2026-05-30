"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  HERO_RIBBON_TRAVEL_MS,
  heroRibbonPhaseForScrollLeft,
  heroRibbonScrollLeftForPhase,
  type HeroRibbonAutoMotion,
} from "@/lib/hero-auto-scroll";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

const RESUME_AFTER_MS = 5_000;
const PROGRAMMATIC_SUPPRESS_MS = 64;

type Options = {
  isDragging?: boolean;
};

export function useHorizontalAutoScroll(
  scrollRef: RefObject<HTMLDivElement | null>,
  mode: HeroRibbonAutoMotion | undefined,
  { isDragging = false }: Options = {}
) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const cyclePhaseRef = useRef(0);
  const maxScrollRef = useRef(0);
  const hasOverflowRef = useRef(false);
  const userPausedRef = useRef(false);
  const resumeTimerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const suppressScrollUntilRef = useRef(0);
  const isActiveRef = useRef(false);
  const [isAutoActive, setIsAutoActive] = useState(false);

  const clearResumeTimer = useCallback(() => {
    if (resumeTimerRef.current !== null) {
      window.clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  const pauseForUser = useCallback(() => {
    if (!isActiveRef.current) return;
    userPausedRef.current = true;
    clearResumeTimer();
    resumeTimerRef.current = window.setTimeout(() => {
      const el = scrollRef.current;
      if (el && mode) {
        cyclePhaseRef.current = heroRibbonPhaseForScrollLeft(
          el.scrollLeft,
          maxScrollRef.current,
          mode,
          cyclePhaseRef.current
        );
      }
      userPausedRef.current = false;
      lastFrameRef.current = null;
      resumeTimerRef.current = null;
    }, RESUME_AFTER_MS);
  }, [clearResumeTimer, mode, scrollRef]);

  const applyScrollLeft = useCallback(
    (value: number) => {
      const el = scrollRef.current;
      if (!el) return;
      suppressScrollUntilRef.current = performance.now() + PROGRAMMATIC_SUPPRESS_MS;
      el.scrollLeft = value;
    },
    [scrollRef]
  );

  const syncScrollFromPhase = useCallback(() => {
    if (!mode) return;
    applyScrollLeft(
      heroRibbonScrollLeftForPhase(cyclePhaseRef.current, maxScrollRef.current, mode)
    );
  }, [applyScrollLeft, mode]);

  const measureOverflow = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return false;

    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    maxScrollRef.current = maxScroll;
    const overflow = maxScroll > 1;
    hasOverflowRef.current = overflow;
    setIsAutoActive(overflow && Boolean(mode) && !prefersReducedMotion);

    if (overflow && mode) {
      syncScrollFromPhase();
    }

    return overflow;
  }, [mode, prefersReducedMotion, scrollRef, syncScrollFromPhase]);

  useEffect(() => {
    if (!mode || prefersReducedMotion) {
      isActiveRef.current = false;
      setIsAutoActive(false);
      return;
    }

    const el = scrollRef.current;
    if (!el) return;

    const overflow = measureOverflow();
    isActiveRef.current = overflow;
    if (!overflow) return;

    cyclePhaseRef.current = 0;
    syncScrollFromPhase();

    const onScroll = () => {
      if (performance.now() < suppressScrollUntilRef.current) return;
      pauseForUser();
    };

    const onWheel = () => {
      pauseForUser();
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("wheel", onWheel, { passive: true });

    const resizeObserver = new ResizeObserver(() => {
      const hadOverflow = hasOverflowRef.current;
      const nextOverflow = measureOverflow();
      isActiveRef.current = nextOverflow;
      if (!hadOverflow && nextOverflow) {
        cyclePhaseRef.current = 0;
        syncScrollFromPhase();
      }
    });
    resizeObserver.observe(el);

    return () => {
      isActiveRef.current = false;
      setIsAutoActive(false);
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("wheel", onWheel);
      resizeObserver.disconnect();
      clearResumeTimer();
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [
    mode,
    prefersReducedMotion,
    scrollRef,
    measureOverflow,
    syncScrollFromPhase,
    pauseForUser,
    clearResumeTimer,
  ]);

  useEffect(() => {
    if (isDragging) {
      pauseForUser();
    }
  }, [isDragging, pauseForUser]);

  useEffect(() => {
    if (!mode || prefersReducedMotion) return;

    const tick = (time: number) => {
      rafRef.current = requestAnimationFrame(tick);

      if (!isActiveRef.current || !hasOverflowRef.current) {
        lastFrameRef.current = time;
        return;
      }

      if (lastFrameRef.current === null) {
        lastFrameRef.current = time;
        return;
      }

      const dt = time - lastFrameRef.current;
      lastFrameRef.current = time;

      if (userPausedRef.current || isDragging) {
        return;
      }

      cyclePhaseRef.current += dt / HERO_RIBBON_TRAVEL_MS;
      if (cyclePhaseRef.current >= 2) {
        cyclePhaseRef.current %= 2;
      }

      syncScrollFromPhase();
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastFrameRef.current = null;
    };
  }, [mode, prefersReducedMotion, isDragging, syncScrollFromPhase]);

  return { isAutoActive };
}
