"use client";

import type { RefObject } from "react";
import { HeroFloatingWindow } from "@/components/hero/HeroFloatingWindow";
import { HeroReportMotion } from "@/components/hero/report/HeroReportMotion";
import { HeroEntryActionsPanel } from "@/components/hero/shared/HeroEntryActionsPanel";
import type { HeroOnboardingActionId } from "@/lib/hero-onboarding";
import {
  HERO_ENTRY_WINDOW,
  type HeroWindowPosition,
} from "@/lib/hero-window-position";
import type { VehicleReport } from "@/lib/types/vehicle-report";

type Props = {
  report: VehicleReport;
  selectedAction: HeroOnboardingActionId | null;
  position?: HeroWindowPosition;
  dragConstraints: RefObject<HTMLElement | null>;
  onSelectAction: (id: HeroOnboardingActionId) => void;
  onClose: () => void;
  onActivate: () => void;
};

export function HeroMainEntryWindow({
  report,
  selectedAction,
  position = HERO_ENTRY_WINDOW,
  dragConstraints,
  onSelectAction,
  onClose,
  onActivate,
}: Props) {
  return (
    <HeroReportMotion key="w-entry">
      <HeroFloatingWindow
        windowId="entry"
        title="Your vehicle found"
        chromeless
        flatPanel
        width={380}
        entranceDelay={0}
        stackDepth={0}
        dragConstraints={dragConstraints}
        defaultPosition={position}
        onClose={onClose}
        onActivate={onActivate}
        ariaLabel="Your vehicle found"
      >
        <HeroEntryActionsPanel
          report={report}
          selectedAction={selectedAction}
          onSelectAction={onSelectAction}
        />
      </HeroFloatingWindow>
    </HeroReportMotion>
  );
}
