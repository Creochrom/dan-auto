"use client";

import type { RefObject } from "react";
import { HeroFloatingWindow } from "@/components/hero/HeroFloatingWindow";
import { HeroReportMotion } from "@/components/hero/report/HeroReportMotion";
import { HeroInsightsHubPanel } from "@/components/hero/shared/HeroInsightsHubPanel";
import type { HeroInsightCategoryId } from "@/lib/hero-onboarding";
import {
  HERO_INSIGHTS_HUB_WINDOW,
  type HeroWindowPosition,
} from "@/lib/hero-window-position";

type Props = {
  selectedCategory: HeroInsightCategoryId | null;
  position?: HeroWindowPosition;
  dragConstraints: RefObject<HTMLElement | null>;
  onSelectCategory: (id: HeroInsightCategoryId) => void;
  onClose: () => void;
  onActivate: () => void;
};

export function HeroInsightsHubWindow({
  selectedCategory,
  position = HERO_INSIGHTS_HUB_WINDOW,
  dragConstraints,
  onSelectCategory,
  onClose,
  onActivate,
}: Props) {
  return (
    <HeroReportMotion key="w-insights-hub">
      <HeroFloatingWindow
        windowId="insights-hub"
        title="Vehicle insights"
        chromeless
        flatPanel
        width={360}
        entranceDelay={0.04}
        stackDepth={1}
        dragConstraints={dragConstraints}
        defaultPosition={position}
        onClose={onClose}
        onActivate={onActivate}
        ariaLabel="Vehicle insights hub"
      >
        <HeroInsightsHubPanel
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
        />
      </HeroFloatingWindow>
    </HeroReportMotion>
  );
}
