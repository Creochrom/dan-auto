"use client";

import type { RefObject } from "react";
import { AnimatePresence } from "framer-motion";
import { HeroFloatingWindow } from "@/components/hero/HeroFloatingWindow";
import { HeroCommonIssuesCard } from "@/components/hero/report/HeroCommonIssuesCard";
import { HeroHealthGauge } from "@/components/hero/report/HeroHealthGauge";
import { HeroLockedPremiumCard } from "@/components/hero/report/HeroLockedPremiumCard";
import { HeroMotTimelineCard } from "@/components/hero/report/HeroMotTimelineCard";
import { HeroRecommendedServicesCard } from "@/components/hero/report/HeroRecommendedServicesCard";
import { HeroReportMotion } from "@/components/hero/report/HeroReportMotion";
import { HeroVehicleFoundCard } from "@/components/hero/report/HeroVehicleFoundCard";
import type { VehicleReport } from "@/lib/types/vehicle-report";

export type ReportWindowLayout = {
  id: string;
  title: string;
  width: number;
  position: { x: number; y: number };
  stackDepth: number;
  delay: number;
};

export const REPORT_WINDOWS: ReportWindowLayout[] = [
  { id: "vehicle", title: "Your vehicle", width: 288, position: { x: 20, y: 72 }, stackDepth: 0, delay: 0 },
  { id: "health", title: "Health score", width: 220, position: { x: 320, y: 56 }, stackDepth: 1, delay: 0.08 },
  { id: "issues", title: "Common issues", width: 268, position: { x: 20, y: 300 }, stackDepth: 2, delay: 0.16 },
  { id: "services", title: "Services", width: 288, position: { x: 300, y: 268 }, stackDepth: 3, delay: 0.24 },
  { id: "mot", title: "MOT history", width: 272, position: { x: 20, y: 460 }, stackDepth: 4, delay: 0.32 },
  { id: "premium", title: "Premium report", width: 260, position: { x: 300, y: 420 }, stackDepth: 5, delay: 0.4 },
];

type Props = {
  report: VehicleReport;
  isMember: boolean;
  revealCount: number;
  closedWindows: ReadonlySet<string>;
  focusBoostFor: (id: string) => number;
  dragConstraints: RefObject<HTMLElement | null>;
  onCloseWindow: (id: string) => void;
  onActivateWindow: (id: string) => void;
  onDiscussAI: () => void;
  onEstimate: () => void;
  onBook: () => void;
  onBookService: (title: string) => void;
  onUnlockMembership: () => void;
};

export function HeroVehicleReportSuite({
  report,
  isMember,
  revealCount,
  closedWindows,
  focusBoostFor,
  dragConstraints,
  onCloseWindow,
  onActivateWindow,
  onDiscussAI,
  onEstimate,
  onBook,
  onBookService,
  onUnlockMembership,
}: Props) {
  const show = (index: number, id: string) =>
    revealCount > index && !closedWindows.has(id);

  return (
    <AnimatePresence mode="popLayout">
      {show(0, "vehicle") && (
        <HeroReportMotion key="w-vehicle">
          <HeroFloatingWindow
            windowId="vehicle"
            title="Your vehicle found"
            chromeless
            entranceDelay={0}
            stackDepth={0}
            focusBoost={focusBoostFor("vehicle")}
            dragConstraints={dragConstraints}
            defaultPosition={REPORT_WINDOWS[0]!.position}
            width={REPORT_WINDOWS[0]!.width}
            onClose={() => onCloseWindow("vehicle")}
            onActivate={() => onActivateWindow("vehicle")}
            ariaLabel="Your vehicle found"
          >
            <HeroVehicleFoundCard
              report={report}
              isMember={isMember}
              onBook={onBook}
              onDiscussAI={onDiscussAI}
            />
          </HeroFloatingWindow>
        </HeroReportMotion>
      )}

      {show(1, "health") && (
        <HeroReportMotion key="w-health">
          <HeroFloatingWindow
            windowId="health"
            title="Vehicle health"
            chromeless
            entranceDelay={0.05}
            stackDepth={1}
            focusBoost={focusBoostFor("health")}
            dragConstraints={dragConstraints}
            defaultPosition={REPORT_WINDOWS[1]!.position}
            width={REPORT_WINDOWS[1]!.width}
            onClose={() => onCloseWindow("health")}
            onActivate={() => onActivateWindow("health")}
          >
            <HeroHealthGauge health={report.health} />
          </HeroFloatingWindow>
        </HeroReportMotion>
      )}

      {show(2, "issues") && (
        <HeroReportMotion key="w-issues" delay={0.16}>
          <HeroFloatingWindow
            windowId="issues"
            title="Common issues"
            chromeless
            stackDepth={2}
            focusBoost={focusBoostFor("issues")}
            dragConstraints={dragConstraints}
            defaultPosition={REPORT_WINDOWS[2]!.position}
            width={REPORT_WINDOWS[2]!.width}
            onClose={() => onCloseWindow("issues")}
            onActivate={() => onActivateWindow("issues")}
          >
            <HeroCommonIssuesCard report={report} />
          </HeroFloatingWindow>
        </HeroReportMotion>
      )}

      {show(3, "services") && (
        <HeroReportMotion key="w-services">
          <HeroFloatingWindow
            windowId="services"
            title="Recommended services"
            chromeless
            entranceDelay={0.15}
            stackDepth={3}
            focusBoost={focusBoostFor("services")}
            dragConstraints={dragConstraints}
            defaultPosition={REPORT_WINDOWS[3]!.position}
            width={REPORT_WINDOWS[3]!.width}
            onClose={() => onCloseWindow("services")}
            onActivate={() => onActivateWindow("services")}
          >
            <HeroRecommendedServicesCard
              report={report}
              onBookService={onBookService}
              onEstimate={onEstimate}
            />
          </HeroFloatingWindow>
        </HeroReportMotion>
      )}

      {show(4, "mot") && (
        <HeroReportMotion key="w-mot">
          <HeroFloatingWindow
            windowId="mot"
            title="MOT history"
            chromeless
            entranceDelay={0.2}
            stackDepth={4}
            focusBoost={focusBoostFor("mot")}
            dragConstraints={dragConstraints}
            defaultPosition={REPORT_WINDOWS[4]!.position}
            width={REPORT_WINDOWS[4]!.width}
            onClose={() => onCloseWindow("mot")}
            onActivate={() => onActivateWindow("mot")}
          >
            <HeroMotTimelineCard report={report} />
          </HeroFloatingWindow>
        </HeroReportMotion>
      )}

      {show(5, "premium") && (
        <HeroReportMotion key="w-premium">
          <HeroFloatingWindow
            windowId="premium"
            title="Premium report"
            chromeless
            entranceDelay={0.25}
            stackDepth={5}
            focusBoost={focusBoostFor("premium")}
            dragConstraints={dragConstraints}
            defaultPosition={REPORT_WINDOWS[5]!.position}
            width={REPORT_WINDOWS[5]!.width}
            onClose={() => onCloseWindow("premium")}
            onActivate={() => onActivateWindow("premium")}
          >
            <HeroLockedPremiumCard isMember={isMember} onUnlock={onUnlockMembership} />
          </HeroFloatingWindow>
        </HeroReportMotion>
      )}
    </AnimatePresence>
  );
}
