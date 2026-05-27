"use client";

import type { ReactNode, RefObject } from "react";
import { AnimatePresence } from "framer-motion";
import { HeroFloatingWindow } from "@/components/hero/HeroFloatingWindow";
import { HeroCommonIssuesCard } from "@/components/hero/report/HeroCommonIssuesCard";
import { HeroHealthGauge } from "@/components/hero/report/HeroHealthGauge";
import { HeroLockedPremiumCard } from "@/components/hero/report/HeroLockedPremiumCard";
import { HeroMotTimelineCard } from "@/components/hero/report/HeroMotTimelineCard";
import { HeroRecommendedServicesCard } from "@/components/hero/report/HeroRecommendedServicesCard";
import { HeroReportMotion } from "@/components/hero/report/HeroReportMotion";
import type { HeroWindowPosition } from "@/lib/hero-window-position";
import type { VehicleReport } from "@/lib/types/vehicle-report";

export type ReportWindowLayout = {
  id: string;
  title: string;
  width: number;
  position: HeroWindowPosition;
  stackDepth: number;
  delay: number;
};

export const REPORT_WINDOWS: ReportWindowLayout[] = [
  {
    id: "health",
    title: "Vehicle health",
    width: 220,
    position: { from: "left", x: "clamp(16px, 46vw, 500px)", y: 200 },
    stackDepth: 2,
    delay: 0.08,
  },
  {
    id: "issues",
    title: "Common issues",
    width: 268,
    position: { from: "left", x: "clamp(16px, 42vw, 460px)", y: 280 },
    stackDepth: 3,
    delay: 0.16,
  },
  {
    id: "services",
    title: "Recommended services",
    width: 288,
    position: { from: "left", x: "clamp(16px, 50vw, 540px)", y: 360 },
    stackDepth: 4,
    delay: 0.24,
  },
  {
    id: "mot",
    title: "MOT history",
    width: 272,
    position: { from: "left", x: "clamp(16px, 44vw, 480px)", y: 440 },
    stackDepth: 5,
    delay: 0.32,
  },
  {
    id: "premium",
    title: "Premium report",
    width: 260,
    position: { from: "left", x: "clamp(16px, 48vw, 520px)", y: 520 },
    stackDepth: 6,
    delay: 0.4,
  },
];

const WINDOW_BY_ID = Object.fromEntries(
  REPORT_WINDOWS.map((w) => [w.id, w])
) as Record<string, ReportWindowLayout>;

type Props = {
  report: VehicleReport;
  isMember: boolean;
  visibleWindowIds: ReadonlySet<string>;
  closedWindows: ReadonlySet<string>;
  dragConstraints: RefObject<HTMLElement | null>;
  onCloseWindow: (id: string) => void;
  onActivateWindow: (id: string) => void;
  onEstimate: () => void;
  onBookService: (title: string) => void;
  onUnlockMembership: () => void;
};

export function HeroVehicleReportSuite({
  report,
  isMember,
  visibleWindowIds,
  closedWindows,
  dragConstraints,
  onCloseWindow,
  onActivateWindow,
  onEstimate,
  onBookService,
  onUnlockMembership,
}: Props) {
  const show = (id: string) =>
    visibleWindowIds.has(id) && !closedWindows.has(id);

  const renderWindow = (
    id: string,
    children: ReactNode,
    extra?: { entranceDelay?: number }
  ) => {
    const layout = WINDOW_BY_ID[id];
    if (!layout || !show(id)) return null;

    return (
      <HeroReportMotion key={`w-${id}`} delay={layout.delay}>
        <HeroFloatingWindow
          windowId={id}
          title={layout.title}
          chromeless
          flatPanel
          flatPanelTier="secondary"
          entranceDelay={extra?.entranceDelay ?? layout.delay}
          stackDepth={layout.stackDepth}
          dragConstraints={dragConstraints}
          defaultPosition={layout.position}
          width={layout.width}
          onClose={() => onCloseWindow(id)}
          onActivate={() => onActivateWindow(id)}
        >
          {children}
        </HeroFloatingWindow>
      </HeroReportMotion>
    );
  };

  return (
    <AnimatePresence mode="popLayout">
      {renderWindow("health", <HeroHealthGauge health={report.health} />, {
        entranceDelay: 0.05,
      })}
      {renderWindow("issues", <HeroCommonIssuesCard report={report} />)}
      {renderWindow(
        "services",
        <HeroRecommendedServicesCard
          report={report}
          onBookService={onBookService}
          onEstimate={onEstimate}
        />,
        { entranceDelay: 0.15 }
      )}
      {renderWindow("mot", <HeroMotTimelineCard report={report} />, {
        entranceDelay: 0.2,
      })}
      {renderWindow(
        "premium",
        <HeroLockedPremiumCard isMember={isMember} onUnlock={onUnlockMembership} />,
        { entranceDelay: 0.25 }
      )}
    </AnimatePresence>
  );
}
