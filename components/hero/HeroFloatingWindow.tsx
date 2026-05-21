"use client";

import { useCallback, type ReactNode, RefObject } from "react";
import { motion, useDragControls, useReducedMotion } from "framer-motion";
import { GripHorizontal, Minus, X } from "lucide-react";
import { heroWindowMotion } from "@/lib/hero-window-motion";

type Props = {
  title: string;
  windowId?: string;
  stackDepth?: number;
  focusBoost?: number;
  dragConstraints?: RefObject<HTMLElement | null>;
  defaultPosition?: { x: number; y: number };
  width?: number;
  entranceDelay?: number;
  minimized?: boolean;
  onMinimize?: () => void;
  onRestore?: () => void;
  onClose: () => void;
  onActivate?: () => void;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  chromeless?: boolean;
};

export function HeroFloatingWindow({
  title,
  windowId,
  stackDepth = 0,
  focusBoost = 0,
  dragConstraints,
  defaultPosition = { x: 0, y: 0 },
  width = 320,
  entranceDelay = 0,
  minimized = false,
  onMinimize,
  onRestore,
  onClose,
  onActivate,
  children,
  className = "",
  ariaLabel,
  chromeless = false,
}: Props) {
  const reduceMotion = useReducedMotion();
  const dragControls = useDragControls();
  const offset = stackDepth * 16;
  const maxWidth = `min(95vw, ${width}px)`;
  const zIndex = 40 + stackDepth + focusBoost;
  const enterMotion = heroWindowMotion(reduceMotion, entranceDelay);

  const handleActivate = useCallback(() => {
    onActivate?.();
  }, [onActivate]);

  const startDrag = useCallback(
    (e: React.PointerEvent) => {
      handleActivate();
      dragControls.start(e);
    },
    [dragControls, handleActivate]
  );

  if (minimized && onRestore) {
    return (
      <motion.button
        type="button"
        drag={!reduceMotion}
        dragConstraints={dragConstraints}
        dragElastic={0.08}
        dragMomentum={false}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        onClick={onRestore}
        onPointerDown={handleActivate}
        data-stack={stackDepth}
        data-window-id={windowId}
        className="hero-floating-pill absolute inline-flex cursor-grab items-center gap-2 rounded-full border border-[#d4a63c]/40 bg-[#080706]/94 px-4 py-2.5 text-[12px] font-semibold text-[#f5e6b8] shadow-[0_8px_32px_rgba(0,0,0,0.55)] backdrop-blur-xl active:cursor-grabbing"
        style={{
          top: defaultPosition.y + offset,
          right: defaultPosition.x + offset,
          zIndex,
        }}
      >
        {title}
      </motion.button>
    );
  }

  const chromeBar = (
    <div
      data-drag-handle
      className="hero-floating-window__chrome-bar flex shrink-0 cursor-grab items-center justify-between gap-2 border-b border-[#d4a63c]/18 px-2.5 py-2 active:cursor-grabbing"
      onPointerDown={startDrag}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <GripHorizontal className="h-4 w-4 shrink-0 text-[#d4a63c]/55" aria-hidden />
        <p className="truncate text-[10px] font-bold uppercase tracking-[0.16em] text-[#d4a63c]/90">
          {title}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {onMinimize && (
          <button
            type="button"
            onClick={onMinimize}
            className="hero-modal-icon-btn"
            aria-label="Minimize"
          >
            <Minus className="h-4 w-4" aria-hidden />
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
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
        role="dialog"
        aria-label={ariaLabel ?? title}
        drag={!reduceMotion}
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={dragConstraints}
        dragElastic={0.08}
        dragMomentum={false}
        initial={enterMotion.initial}
        animate={enterMotion.animate}
        exit={enterMotion.exit}
        transition={enterMotion.transition}
        data-stack={stackDepth}
        data-window-id={windowId}
        className={`hero-floating-window hero-floating-window--chromeless absolute cursor-default ${className}`}
        style={{
          top: defaultPosition.y + offset,
          right: defaultPosition.x + offset,
          width,
          maxWidth,
          zIndex,
        }}
        onPointerDownCapture={handleActivate}
      >
        <div className="hero-floating-window__shell hero-floating-window__shell--chromeless rounded-[22px] border border-[#d4a63c]/30 bg-[#080706]/92 shadow-[0_24px_64px_rgba(0,0,0,0.65),0_0_48px_rgba(212,166,60,0.12)] backdrop-blur-xl">
          {chromeBar}
          <div className="hero-floating-window__body hero-floating-window__body--chromeless">
            {children}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      role="dialog"
      aria-label={ariaLabel ?? title}
      drag={!reduceMotion}
      dragControls={dragControls}
      dragListener={false}
      dragConstraints={dragConstraints}
      dragElastic={0.08}
      dragMomentum={false}
      initial={enterMotion.initial}
      animate={enterMotion.animate}
      exit={enterMotion.exit}
      transition={enterMotion.transition}
      data-stack={stackDepth}
      data-window-id={windowId}
      className={`hero-floating-window absolute ${className}`}
      style={{
        top: defaultPosition.y + offset,
        right: defaultPosition.x + offset,
        width,
        maxWidth,
        zIndex,
      }}
      onPointerDownCapture={handleActivate}
    >
      <div className="hero-floating-window__shell rounded-[24px] border border-[#d4a63c]/32 bg-[#080706]/92 shadow-[0_24px_64px_rgba(0,0,0,0.65),0_0_48px_rgba(212,166,60,0.12)] backdrop-blur-xl">
        {chromeBar}
        <div className="hero-floating-window__body">{children}</div>
      </div>
    </motion.div>
  );
}
