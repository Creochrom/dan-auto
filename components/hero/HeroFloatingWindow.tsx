"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  RefObject,
} from "react";
import {
  motion,
  useDragControls,
  useReducedMotion,
  type PanInfo,
} from "framer-motion";
import { GripHorizontal, Minus, RotateCcw, X } from "lucide-react";
import { useHeroWindowManagerOptional } from "@/components/hero/windows/HeroWindowManager";
import { useHeroWindowStackOptional } from "@/components/hero/windows/HeroWindowStackContext";
import { useHeroFloatingWindowPlacement } from "@/hooks/useHeroFloatingWindowPlacement";
import { heroWindowMotion } from "@/lib/hero-window-motion";
import { HERO_WINDOW_EST_HEIGHT_PX } from "@/lib/hero-window-stack-position";
import type { HeroWindowPosition } from "@/lib/hero-window-position";

type LegacyPosition = { x: number; y: number };

type Props = {
  title: string;
  windowId?: string;
  stackDepth?: number;
  /** Responsive stack index among visible windows (mobile/tablet). */
  cascadeIndex?: number;
  focusBoost?: number;
  dragConstraints?: RefObject<HTMLElement | null>;
  defaultPosition?: LegacyPosition | HeroWindowPosition;
  width?: number;
  entranceDelay?: number;
  minimized?: boolean;
  /** Optional reset control shown in the chrome bar (replaces minimize for this window). */
  onReset?: () => void;
  onMinimize?: () => void;
  onRestore?: () => void;
  onClose: () => void;
  onActivate?: () => void;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  chromeless?: boolean;
  /** Single-frame panel: title only in chrome bar, no nested bordered body shell. */
  flatPanel?: boolean;
  /** `secondary` = insight cards; slightly softer than entry/insights hub. */
  flatPanelTier?: "primary" | "secondary";
};

export function HeroFloatingWindow({
  title,
  windowId,
  stackDepth = 0,
  cascadeIndex: cascadeIndexProp,
  focusBoost = 0,
  dragConstraints,
  defaultPosition = { x: 0, y: 0 },
  width = 320,
  entranceDelay = 0,
  minimized = false,
  onReset,
  onMinimize,
  onRestore,
  onClose,
  onActivate,
  children,
  className = "",
  ariaLabel,
  chromeless = false,
  flatPanel = false,
  flatPanelTier = "primary",
}: Props) {
  const reduceMotion = useReducedMotion();
  const dragControls = useDragControls();
  const wm = useHeroWindowManagerOptional();
  const stackCtx = useHeroWindowStackOptional();
  const cascadeIndex =
    cascadeIndexProp ??
    (windowId ? stackCtx?.getCascadeIndex(windowId) : undefined) ??
    stackDepth;

  const [spawnLocked, setSpawnLocked] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [manualOffset, setManualOffset] = useState({ x: 0, y: 0 });
  const [windowHeight, setWindowHeight] = useState(HERO_WINDOW_EST_HEIGHT_PX);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const { tier, placement: anchorStyle } = useHeroFloatingWindowPlacement({
    cascadeIndex,
    stackDepth,
    windowWidth: width,
    windowHeight,
    defaultPosition,
    containerRef: dragConstraints,
    freezePlacement: spawnLocked || isDragging,
  });

  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;

    const measure = () => {
      const next = Math.max(HERO_WINDOW_EST_HEIGHT_PX, Math.round(node.getBoundingClientRect().height));
      setWindowHeight((prev) => (prev === next ? prev : next));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [children, minimized, chromeless, flatPanel, title]);

  const dragEnabled = !reduceMotion;
  const managedZ =
    windowId && wm ? wm.getZIndex(windowId) : 40 + stackDepth + focusBoost;

  const wmRef = useRef(wm);
  wmRef.current = wm;
  const windowIdRef = useRef(windowId);
  windowIdRef.current = windowId;

  useEffect(() => {
    const id = windowIdRef.current;
    const manager = wmRef.current;
    if (!id || !manager) return;
    manager.registerWindow(id);
    return () => manager.unregisterWindow(id);
  }, []);

  const enterMotion = heroWindowMotion(reduceMotion, entranceDelay, tier);

  const handleActivate = useCallback(() => {
    const id = windowId;
    const manager = wmRef.current;
    if (id && manager) manager.bringToFront(id);
    onActivate?.();
  }, [onActivate, windowId]);

  const handleActivateCapture = useCallback(
    (e: React.PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-drag-handle]")) return;
      if (target.closest(".hero-floating-window__chrome-actions")) return;
      handleActivate();
    },
    [handleActivate]
  );

  const startDrag = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragEnabled) return;
      e.preventDefault();
      e.stopPropagation();
      handleActivate();
      setIsDragging(true);
      dragControls.start(e);
    },
    [dragControls, handleActivate, dragEnabled, windowId]
  );

  const stopChromePointer = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
  }, []);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleDragEnd = useCallback(
    (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setIsDragging(false);
      const container = dragConstraints?.current;
      const self = rootRef.current;
      if (!container || !self) {
        setManualOffset((prev) => ({
          x: prev.x + info.offset.x,
          y: prev.y + info.offset.y,
        }));
        setSpawnLocked(true);
        return;
      }

      const header = document.querySelector("header.site-nav");
      const ribbons = document.querySelector(".hero-info-ribbons");
      const containerRect = container.getBoundingClientRect();
      const selfRect = self.getBoundingClientRect();
      const headerBottom = header?.getBoundingClientRect().bottom ?? containerRect.top;
      const ribbonsTop = ribbons?.getBoundingClientRect().top ?? containerRect.bottom;
      const padTop = tier === "mobile" ? 8 : 12;
      const padBottom = tier === "mobile" ? 10 : 14;
      const minTop = Math.max(containerRect.top + padTop, headerBottom + padTop);
      const maxBottom = Math.min(containerRect.bottom - padBottom, ribbonsTop - padBottom);
      const maxTop = Math.max(minTop, maxBottom - selfRect.height);

      const nextLeft = selfRect.left + info.offset.x;
      const nextTop = selfRect.top + info.offset.y;
      const minLeft = containerRect.left + 8;
      const maxLeft = Math.max(minLeft, containerRect.right - selfRect.width - 8);

      const clampedLeft = Math.min(maxLeft, Math.max(minLeft, nextLeft));
      const clampedTop = Math.min(maxTop, Math.max(minTop, nextTop));

      const dx = clampedLeft - selfRect.left;
      const dy = clampedTop - selfRect.top;

      setManualOffset((prev) => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }));
      setSpawnLocked(true);
    },
    [dragConstraints, tier]
  );

  const positionStyle: CSSProperties = {
    ...anchorStyle,
    zIndex: managedZ,
  };

  const lockedMotion = {
    opacity: 1,
    x: manualOffset.x,
    y: manualOffset.y,
    scale: 1,
  };

  const motionAnimate = isDragging
    ? { opacity: 1, scale: 1 }
    : spawnLocked
      ? lockedMotion
      : enterMotion.animate;

  const motionInitial = isDragging
    ? { opacity: 1, scale: 1 }
    : spawnLocked
      ? lockedMotion
      : enterMotion.initial;

  const motionTransition =
    isDragging || spawnLocked
      ? { duration: 0 }
      : enterMotion.transition;

  const dragMotionProps = {
    drag: dragEnabled,
    dragControls,
    dragListener: false as const,
    dragConstraints,
    dragElastic: 0,
    dragMomentum: false,
    dragTransition: { power: 0, timeConstant: 0 },
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
  };

  const windowClassSuffix = [
    tier !== "desktop" ? "hero-floating-window--responsive-stack" : "",
    isDragging ? "hero-floating-window--dragging" : "",
    dragEnabled ? "hero-floating-window--draggable" : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (minimized && onRestore) {
    return (
      <motion.button
        type="button"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        onClick={onRestore}
        onPointerDown={handleActivate}
        data-stack={stackDepth}
        data-window-id={windowId}
        className="hero-floating-pill absolute inline-flex cursor-grab items-center gap-2 rounded-full border border-[#d4a63c]/40 bg-[#080706]/94 px-4 py-2.5 text-[12px] font-semibold text-[#f5e6b8] shadow-[0_8px_32px_rgba(0,0,0,0.55)] backdrop-blur-xl active:cursor-grabbing"
        style={positionStyle}
      >
        {title}
      </motion.button>
    );
  }

  const chromeBar = (
    <div className="hero-floating-window__chrome-bar flex shrink-0 items-center justify-between gap-2 border-b border-[#d4a63c]/18 px-2.5 py-2">
      <div
        data-drag-handle
        className={`hero-floating-window__drag-handle flex min-w-0 flex-1 items-center gap-2 ${dragEnabled ? "cursor-grab active:cursor-grabbing" : ""}`}
        onPointerDown={startDrag}
      >
        <GripHorizontal className="h-4 w-4 shrink-0 text-[#d4a63c]/55" aria-hidden />
        <p className="min-w-0 flex-1 truncate text-[10px] font-bold uppercase tracking-[0.16em] text-[#d4a63c]/90">
          {title}
        </p>
      </div>
      <div
        className="hero-floating-window__chrome-actions flex shrink-0 items-center gap-1"
        onPointerDown={stopChromePointer}
      >
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            onPointerDown={stopChromePointer}
            className="hero-modal-icon-btn"
            aria-label="Reset"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
          </button>
        )}
        {!onReset && onMinimize && (
          <button
            type="button"
            onClick={onMinimize}
            onPointerDown={stopChromePointer}
            className="hero-modal-icon-btn"
            aria-label="Minimize"
          >
            <Minus className="h-4 w-4" aria-hidden />
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          onPointerDown={stopChromePointer}
          className="hero-modal-icon-btn hero-modal-icon-btn--close"
          aria-label={`Close ${title}`}
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );

  if (chromeless) {
    return (
      <motion.div
        ref={rootRef}
        role="dialog"
        aria-label={ariaLabel ?? title}
        {...dragMotionProps}
        initial={motionInitial}
        animate={motionAnimate}
        exit={enterMotion.exit}
        transition={motionTransition}
        data-stack={stackDepth}
        data-window-id={windowId}
        data-spawn-locked={spawnLocked ? "true" : undefined}
        className={`hero-floating-window hero-floating-window--chromeless absolute ${windowClassSuffix} ${flatPanel ? "hero-floating-window--flat-panel" : ""} ${flatPanel && flatPanelTier === "secondary" ? "hero-floating-window--flat-panel-secondary" : ""} ${className}`}
        style={positionStyle}
        onPointerDownCapture={handleActivateCapture}
      >
        <div
          className={
            flatPanel
              ? `hero-floating-window__shell hero-floating-window__shell--chromeless hero-floating-window__shell--flat${flatPanelTier === "secondary" ? " hero-floating-window__shell--flat-secondary" : ""}`
              : "hero-floating-window__shell hero-floating-window__shell--chromeless rounded-[22px] border border-[#d4a63c]/30 bg-[#080706]/92 shadow-[0_24px_64px_rgba(0,0,0,0.65),0_0_48px_rgba(212,166,60,0.12)] backdrop-blur-xl"
          }
        >
          {chromeBar}
          <div className="hero-floating-window__body hero-floating-window__body--chromeless p-0">
            {children}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={rootRef}
      role="dialog"
      aria-label={ariaLabel ?? title}
      {...dragMotionProps}
      initial={motionInitial}
      animate={motionAnimate}
      exit={enterMotion.exit}
      transition={motionTransition}
      data-stack={stackDepth}
      data-window-id={windowId}
      data-spawn-locked={spawnLocked ? "true" : undefined}
      className={`hero-floating-window absolute ${windowClassSuffix} ${className}`}
      style={positionStyle}
      onPointerDownCapture={handleActivateCapture}
    >
      <div className="hero-floating-window__shell rounded-[24px] border border-[#d4a63c]/32 bg-[#080706]/92 shadow-[0_24px_64px_rgba(0,0,0,0.65),0_0_48px_rgba(212,166,60,0.12)] backdrop-blur-xl">
        {chromeBar}
        <div className="hero-floating-window__body">{children}</div>
      </div>
    </motion.div>
  );
}
