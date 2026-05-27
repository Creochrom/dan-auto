"use client";

import { useCallback, useRef, useState, type PointerEvent } from "react";

type DragState = {
  active: boolean;
  startX: number;
  scrollLeft: number;
  pointerId: number;
};

/**
 * Pointer-driven horizontal drag scroll for premium carousels.
 * Works with native touch momentum via overflow-x: auto.
 */
export function useHorizontalDragScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState>({
    active: false,
    startX: 0,
    scrollLeft: 0,
    pointerId: -1,
  });
  const [isDragging, setIsDragging] = useState(false);

  const endDrag = useCallback((pointerId: number) => {
    const el = ref.current;
    if (drag.current.active && el?.hasPointerCapture(pointerId)) {
      el.releasePointerCapture(pointerId);
    }
    drag.current.active = false;
    setIsDragging(false);
  }, []);

  const onPointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || e.button !== 0) return;
    drag.current = {
      active: true,
      startX: e.clientX,
      scrollLeft: el.scrollLeft,
      pointerId: e.pointerId,
    };
    el.setPointerCapture(e.pointerId);
    setIsDragging(true);
  }, []);

  const onPointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active || !ref.current) return;
    const dx = e.clientX - drag.current.startX;
    ref.current.scrollLeft = drag.current.scrollLeft - dx;
  }, []);

  const onPointerUp = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      endDrag(e.pointerId);
    },
    [endDrag]
  );

  const onPointerCancel = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      endDrag(e.pointerId);
    },
    [endDrag]
  );

  return {
    ref,
    isDragging,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerLeave: onPointerUp,
      onPointerCancel,
    },
  };
}
