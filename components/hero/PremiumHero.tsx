"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence } from "framer-motion";
import { Car, Check } from "lucide-react";
import { PlateInput } from "@/components/PlateInput";
import { HeroAIChatModal } from "@/components/hero/HeroAIChatModal";
import { HeroBookInspectionModal } from "@/components/hero/HeroBookInspectionModal";
import { HeroEstimateModal } from "@/components/hero/HeroEstimateModal";
import { HeroOverlayStage } from "@/components/hero/HeroOverlayStage";
import { HeroReportSkeleton } from "@/components/hero/report/HeroReportSkeleton";
import { HeroVehicleReportSuite } from "@/components/hero/report/HeroVehicleReportSuite";
import { HeroServiceInfoModal } from "@/components/hero/HeroServiceInfoModal";
import { HeroServiceStrip } from "@/components/hero/HeroServiceStrip";
import { HeroTrustStrip } from "@/components/hero/HeroTrustStrip";
import {
  buildHeroTrustBadges,
  HERO_SERVICE_CARDS,
  type HeroServiceCard,
} from "@/lib/hero-content";
import { HERO_SHOWCASE_VEHICLE } from "@/lib/vehicle-data";
import { stripPlate } from "@/lib/format-plate";
import { fetchVehicleLookup } from "@/lib/vehicle-lookup-client";
import { buildVehicleReport } from "@/lib/vehicle-report-builder";
import type { VehicleReport } from "@/lib/types/vehicle-report";
import type { VehicleResult } from "@/lib/types/vehicle";

const MODAL_DEFAULT = { x: 20, y: 88 };
const REVEAL_WINDOW_COUNT = 6;

type PremiumHeroProps = {
  badge: string;
  experience: string;
  googleRating: string;
  googleReviewCount: string;
  heroPlate: string;
  onPlateChange: (v: string) => void;
  onLookup: (reg: string) => void;
  onReportReady?: (report: VehicleReport) => void;
  scanPhase: "idle" | "scanning" | "done";
  scanStep: number;
  vehicle: VehicleResult | null;
  isMember?: boolean;
  plateFocused: boolean;
  onPlateFocus: () => void;
  onPlateBlur: () => void;
  onCreateAccount: () => void;
  onBookNow: () => void;
  onHeroServiceSelect: (serviceBookLabel: string) => void;
  onDiscussAI: () => void;
  onEstimateRepair: () => void;
  onBookInspection: () => void;
  onMembershipNote: () => void;
};

export function PremiumHero({
  badge,
  experience,
  googleRating,
  googleReviewCount,
  heroPlate,
  onPlateChange,
  onLookup,
  onReportReady,
  plateFocused,
  onPlateFocus,
  onPlateBlur,
  onHeroServiceSelect,
  onBookInspection,
  onMembershipNote,
  isMember = false,
}: PremiumHeroProps) {
  const [plateError, setPlateError] = useState<string | null>(null);
  const [plateShake, setPlateShake] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [vehicleReport, setVehicleReport] = useState<VehicleReport | null>(null);
  const [vehicleData, setVehicleData] = useState<VehicleResult | null>(null);
  const [lookupMatched, setLookupMatched] = useState(false);
  const [showReportSuite, setShowReportSuite] = useState(false);
  const [revealCount, setRevealCount] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(false);
  const [estimateOpen, setEstimateOpen] = useState(false);
  const [estimateMinimized, setEstimateMinimized] = useState(false);
  const [inspectionOpen, setInspectionOpen] = useState(false);
  const [inspectionMinimized, setInspectionMinimized] = useState(false);
  const [selectedService, setSelectedService] = useState<HeroServiceCard | null>(null);
  const [closedReportWindows, setClosedReportWindows] = useState<Set<string>>(
    () => new Set()
  );
  const [focusedWindowId, setFocusedWindowId] = useState<string | null>(null);

  const heroStageRef = useRef<HTMLDivElement>(null);
  const heroOverlayStageRef = useRef<HTMLDivElement>(null);
  const revealTimersRef = useRef<number[]>([]);

  const trustBadges = useMemo(
    () =>
      buildHeroTrustBadges({
        experience,
        googleRating,
        googleReviewCount,
      }),
    [experience, googleRating, googleReviewCount]
  );

  const serviceStripItems = useMemo(
    () =>
      HERO_SERVICE_CARDS.map((card) => ({
        icon: card.icon,
        title: card.title,
        hint: card.hint,
      })),
    []
  );

  const clearRevealTimers = useCallback(() => {
    revealTimersRef.current.forEach((id) => window.clearTimeout(id));
    revealTimersRef.current = [];
  }, []);

  const startRevealSequence = useCallback(() => {
    clearRevealTimers();
    setRevealCount(0);
    for (let i = 0; i < REVEAL_WINDOW_COUNT; i++) {
      const id = window.setTimeout(() => setRevealCount(i + 1), 180 + i * 110);
      revealTimersRef.current.push(id);
    }
  }, [clearRevealTimers]);

  useEffect(() => {
    return () => clearRevealTimers();
  }, [clearRevealTimers]);

  const resetLookupState = useCallback(() => {
    clearRevealTimers();
    setIsLoading(false);
    setShowReportSuite(false);
    setVehicleReport(null);
    setVehicleData(null);
    setLookupMatched(false);
    setRevealCount(0);
    setChatOpen(false);
    setChatMinimized(false);
    setEstimateOpen(false);
    setEstimateMinimized(false);
    setInspectionOpen(false);
    setInspectionMinimized(false);
    setClosedReportWindows(new Set());
    setFocusedWindowId(null);
  }, [clearRevealTimers]);

  const focusBoostFor = useCallback(
    (id: string) => (focusedWindowId === id ? 40 : 0),
    [focusedWindowId]
  );

  const closeReportWindow = useCallback((id: string) => {
    setClosedReportWindows((prev) => new Set(prev).add(id));
  }, []);

  const activateWindow = useCallback((id: string) => {
    setFocusedWindowId(id);
  }, []);

  const applyReport = useCallback(
    (report: VehicleReport) => {
      setVehicleReport(report);
      setVehicleData(report.legacy);
      setLookupMatched(report.matched);
      setShowReportSuite(true);
      onReportReady?.(report);
      startRevealSequence();
    },
    [onReportReady, startRevealSequence]
  );

  const handlePlateChange = useCallback(
    (v: string) => {
      onPlateChange(v);
      if (showReportSuite || isLoading) resetLookupState();
    },
    [onPlateChange, showReportSuite, isLoading, resetLookupState]
  );

  const handleInvalidPlateInput = useCallback(() => {
    setPlateShake(true);
    window.setTimeout(() => setPlateShake(false), 220);
  }, []);

  const handleLookupClick = useCallback(async () => {
    const canon = stripPlate(heroPlate);
    if (canon.length < 2) {
      setPlateError("Please enter registration");
      setPlateShake(true);
      window.setTimeout(() => setPlateShake(false), 520);
      return;
    }

    setPlateError(null);
    resetLookupState();
    setIsLoading(true);
    onLookup(heroPlate);

    try {
      const data = await fetchVehicleLookup(canon);
      applyReport(data.report);
    } catch {
      const fallback = buildVehicleReport(canon);
      applyReport(fallback);
    } finally {
      setIsLoading(false);
    }
  }, [heroPlate, onLookup, resetLookupState, applyReport]);

  useEffect(() => {
    if (plateError && stripPlate(heroPlate).length >= 2) {
      setPlateError(null);
    }
  }, [heroPlate, plateError]);

  const openChat = useCallback(() => {
    setEstimateOpen(false);
    setEstimateMinimized(false);
    setInspectionOpen(false);
    setInspectionMinimized(false);
    setChatOpen(true);
    setChatMinimized(false);
    setFocusedWindowId("chat");
  }, []);

  const openEstimate = useCallback(() => {
    setChatMinimized(true);
    setInspectionOpen(false);
    setInspectionMinimized(false);
    setEstimateOpen(true);
    setEstimateMinimized(false);
    setFocusedWindowId("estimate");
  }, []);

  const openInspection = useCallback(() => {
    setInspectionOpen(true);
    setInspectionMinimized(false);
    setFocusedWindowId("inspection");
  }, []);

  const overlayActive =
    isLoading ||
    (showReportSuite && !!vehicleReport) ||
    chatOpen ||
    estimateOpen ||
    inspectionOpen;

  return (
    <section className="hero" aria-labelledby="hero-heading">
      <div className="hero-container pt-2 sm:pt-4 lg:pt-2">
        <div className="hero-composition" ref={heroOverlayStageRef}>
        <div className="hero-stage" ref={heroStageRef}>
          <div className="hero-grid">
            <div className="hero-left w-full max-w-none lg:max-w-[560px]">
              <div className="hero-badge inline-flex w-fit items-center gap-2 rounded-full border border-[#d4a63c]/40 bg-black/60 px-3 py-1.5">
                <Car className="h-3.5 w-3.5 text-[#d4a63c]" aria-hidden />
                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#d4a63c]">
                  {badge}
                </span>
              </div>

              <h1
                id="hero-heading"
                className="hero-heading mt-3 max-lg:[text-shadow:0_2px_24px_rgba(0,0,0,0.65)] sm:mt-4 lg:mt-5 lg:[text-shadow:none]"
              >
                <span className="block text-[clamp(1.5rem,6.2vw,2.1rem)] font-extrabold uppercase leading-[1.05] tracking-[-0.025em] text-white sm:text-[clamp(1.85rem,4.8vw,2.5rem)] lg:text-[clamp(2.75rem,4.8vw,4.25rem)] lg:leading-[0.96] lg:tracking-[-0.04em]">
                  EXPERT CARE
                </span>
                <span className="gold-metallic block bg-clip-text text-[clamp(1.5rem,6.2vw,2.1rem)] font-extrabold uppercase leading-[1.05] tracking-[-0.025em] text-transparent sm:text-[clamp(1.85rem,4.8vw,2.5rem)] lg:-mt-1 lg:text-[clamp(2.75rem,4.8vw,4.25rem)] lg:leading-[0.96] lg:tracking-[-0.04em]">
                  FOR YOUR CAR
                </span>
              </h1>

              <p className="hero-subcopy mt-3 max-w-[520px] text-[13px] font-medium leading-relaxed text-white/88 max-lg:[text-shadow:0_1px_14px_rgba(0,0,0,0.7)] sm:mt-4 sm:text-[14px] lg:mt-6 lg:text-[16px] lg:text-white/82 lg:[text-shadow:none]">
                Dealer-level diagnostics, MOT testing, and premium repairs for BMW,
                Audi, Mercedes and more.
              </p>

              <div
                className={`hero-plate-glass mt-4 w-full max-w-[540px] rounded-2xl border bg-black/78 px-4 py-5 transition-[border-color,box-shadow] duration-300 sm:mt-5 sm:px-5 lg:mt-7 lg:max-w-[540px] ${
                  plateError
                    ? "border-red-500/45 shadow-[0_0_28px_rgba(239,68,68,0.18)]"
                    : "border-[#d4a63c]/24"
                } ${plateShake ? "hero-plate-shake hero-plate-shake--micro" : ""}`}
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#d4a63c]">
                  Enter your registration
                </p>
                <div className="relative mt-3">
                  <PlateInput
                    id="hero"
                    variant="luxury"
                    value={heroPlate}
                    onChange={handlePlateChange}
                    onSubmit={handleLookupClick}
                    onInvalidInput={handleInvalidPlateInput}
                    loading={isLoading}
                    focused={plateFocused}
                    onFocus={onPlateFocus}
                    onBlur={onPlateBlur}
                    submitLabel="Scan vehicle"
                    loadingLabel="Analysing…"
                    alwaysEnableSubmit
                  />
                </div>
                {plateError && (
                  <p className="mt-2 text-[11px] font-medium text-red-400/90" role="alert">
                    {plateError}
                  </p>
                )}
                {isLoading && (
                  <p className="mt-2.5 text-[11px] font-medium text-[#d4a63c]/90">
                    AI is analysing your vehicle…
                  </p>
                )}
                {!isLoading && showReportSuite && !lookupMatched && (
                  <p className="mt-2.5 text-[11px] font-medium text-amber-200/80">
                    Registration not in demo database — limited analysis shown.
                  </p>
                )}
                <p className="hero-plate-trust mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-[10px] font-medium tracking-[0.01em] text-white/55 sm:mt-4 sm:text-[11px]">
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-[#d4a63c]/85" aria-hidden />
                    Instant DVLA check
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-[#d4a63c]/85" aria-hidden />
                    AI vehicle analysis
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="h-3 w-3 text-[#d4a63c]/85" aria-hidden />
                    Secure &amp; private
                  </span>
                </p>
              </div>
            </div>

            <div className="hero-right" aria-hidden="true">
              <div className="hero-bmw-glow" aria-hidden />
              <div className="hero-bmw">
                <div className="hero-bmw-media">
                  <Image
                    src={HERO_SHOWCASE_VEHICLE}
                    alt="Black BMW 320d with gold wheels in Dan Auto workshop."
                    width={1040}
                    height={600}
                    priority
                    fetchPriority="high"
                    quality={95}
                    className="hero-bmw-img max-lg:brightness-[0.72] max-lg:contrast-[1.04] max-lg:saturate-[0.98] sm:max-lg:brightness-[0.74] lg:brightness-100 lg:contrast-100 lg:saturate-100"
                  />
                  {/* Mobile/tablet scrim — lighter than before; hidden on desktop (mask handles blend) */}
                  <div
                    className="pointer-events-none absolute inset-0 z-[2] block bg-[linear-gradient(180deg,rgba(3,3,3,0.3)_0%,rgba(3,3,3,0.16)_38%,rgba(3,3,3,0.24)_72%,rgba(3,3,3,0.36)_100%),linear-gradient(90deg,rgba(3,3,3,0.32)_0%,rgba(3,3,3,0.12)_38%,rgba(3,3,3,0.04)_62%,transparent_100%)] max-sm:bg-[linear-gradient(180deg,rgba(3,3,3,0.24)_0%,rgba(3,3,3,0.12)_38%,rgba(3,3,3,0.2)_72%,rgba(3,3,3,0.32)_100%),linear-gradient(90deg,rgba(3,3,3,0.26)_0%,rgba(3,3,3,0.1)_38%,rgba(3,3,3,0.03)_62%,transparent_100%)] lg:hidden"
                    aria-hidden
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-below">
          <HeroServiceStrip
            items={serviceStripItems}
            onSelect={(title) => {
              const card = HERO_SERVICE_CARDS.find((c) => c.title === title);
              if (card) setSelectedService(card);
            }}
          />
          <div className="mt-5 sm:mt-6">
            <HeroTrustStrip badges={trustBadges} />
          </div>
        </div>

        <HeroOverlayStage active={overlayActive}>
          {isLoading && (
            <div className="pointer-events-none absolute left-1/2 top-16 z-[45] -translate-x-1/2">
              <HeroReportSkeleton />
            </div>
          )}

          {showReportSuite && vehicleReport && (
            <HeroVehicleReportSuite
              report={vehicleReport}
              isMember={isMember}
              revealCount={revealCount}
              closedWindows={closedReportWindows}
              focusBoostFor={focusBoostFor}
              dragConstraints={heroOverlayStageRef}
              onCloseWindow={closeReportWindow}
              onActivateWindow={activateWindow}
              onDiscussAI={openChat}
              onEstimate={openEstimate}
              onBook={openInspection}
              onBookService={(title) => onHeroServiceSelect(title)}
              onUnlockMembership={onMembershipNote}
            />
          )}

          {vehicleData && (
            <>
              <AnimatePresence>
                {chatOpen && (
                  <HeroAIChatModal
                    vehicle={vehicleData}
                    open={chatOpen}
                    minimized={chatMinimized}
                    stackDepth={8}
                    entranceDelay={0.04}
                    focusBoost={focusBoostFor("chat")}
                    dragConstraints={heroOverlayStageRef}
                    defaultPosition={MODAL_DEFAULT}
                    onActivate={() => activateWindow("chat")}
                    onMinimize={() => setChatMinimized(true)}
                    onRestore={() => setChatMinimized(false)}
                    onClose={() => {
                      setChatOpen(false);
                      setChatMinimized(false);
                    }}
                  />
                )}
              </AnimatePresence>
              <AnimatePresence>
                {estimateOpen && (
                  <HeroEstimateModal
                    vehicle={vehicleData}
                    open={estimateOpen}
                    minimized={estimateMinimized}
                    stackDepth={9}
                    entranceDelay={0.05}
                    focusBoost={focusBoostFor("estimate")}
                    dragConstraints={heroOverlayStageRef}
                    defaultPosition={MODAL_DEFAULT}
                    onActivate={() => activateWindow("estimate")}
                    onMinimize={() => setEstimateMinimized(true)}
                    onRestore={() => setEstimateMinimized(false)}
                    onClose={() => {
                      setEstimateOpen(false);
                      setEstimateMinimized(false);
                    }}
                  />
                )}
              </AnimatePresence>
              <AnimatePresence>
                {inspectionOpen && (
                  <HeroBookInspectionModal
                    vehicle={vehicleData}
                    open={inspectionOpen}
                    minimized={inspectionMinimized}
                    stackDepth={10}
                    entranceDelay={0.05}
                    focusBoost={focusBoostFor("inspection")}
                    dragConstraints={heroOverlayStageRef}
                    defaultPosition={MODAL_DEFAULT}
                    onActivate={() => activateWindow("inspection")}
                    onMinimize={() => setInspectionMinimized(true)}
                    onRestore={() => setInspectionMinimized(false)}
                    onClose={() => {
                      setInspectionOpen(false);
                      setInspectionMinimized(false);
                    }}
                    onConfirm={() => {
                      setInspectionOpen(false);
                      onBookInspection();
                    }}
                  />
                )}
              </AnimatePresence>
            </>
          )}
        </HeroOverlayStage>
        </div>
      </div>

      <AnimatePresence>
        {selectedService && (
          <HeroServiceInfoModal
            service={selectedService}
            onClose={() => setSelectedService(null)}
            onBook={onHeroServiceSelect}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
