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
import { HeroWindowLayer } from "@/components/hero/windows/HeroWindowLayer";
import { HeroInsightsHubWindow } from "@/components/hero/windows/HeroInsightsHubWindow";
import { HeroMainEntryWindow } from "@/components/hero/windows/HeroMainEntryWindow";
import {
  HeroWindowManagerProvider,
  useHeroWindowManager,
} from "@/components/hero/windows/HeroWindowManager";
import {
  buildHeroTrustBadges,
  HERO_SERVICE_CARDS,
  type HeroServiceCard,
} from "@/lib/hero-content";
import {
  HERO_INSIGHT_CATEGORIES,
  type HeroInsightCategoryId,
  type HeroOnboardingActionId,
} from "@/lib/hero-onboarding";
import { HERO_SHOWCASE_VEHICLE } from "@/lib/vehicle-data";
import { useAssistant } from "@/features/assistant/AssistantContext";
import { stripPlate } from "@/lib/format-plate";
import type { AdvisorRouteContext } from "@/lib/types/advisor-routing";
import type { HeroConciergeMode } from "@/lib/types/hero-concierge";
import { fetchVehicleLookup } from "@/lib/vehicle-lookup-client";
import { buildVehicleReport } from "@/lib/vehicle-report-builder";
import type { VehicleReport } from "@/lib/types/vehicle-report";
import type { VehicleResult } from "@/lib/types/vehicle";

const MODAL_DEFAULT = { x: 20, y: 88 };

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

function PremiumHeroWindowStack({
  showReportSuite,
  vehicleReport,
  vehicleData,
  isMember,
  isLoading,
  insightsHubOpen,
  visibleInsightWindows,
  closedReportWindows,
  selectedOnboardingAction,
  selectedInsightCategory,
  chatOpen,
  chatMinimized,
  onSelectOnboardingAction,
  onSelectInsightCategory,
  onCloseEntry,
  onCloseInsightsHub,
  onCloseReportWindow,
  onActivateWindow,
  onChatActivate,
  onChatMinimize,
  onChatRestore,
  onChatClose,
  onBookService,
  onEstimate,
  onUnlockMembership,
  heroLaunchId,
  heroConciergeMode,
  heroAdvisorRoute,
}: {
  showReportSuite: boolean;
  vehicleReport: VehicleReport | null;
  vehicleData: VehicleResult | null;
  isMember: boolean;
  isLoading: boolean;
  insightsHubOpen: boolean;
  visibleInsightWindows: ReadonlySet<string>;
  closedReportWindows: ReadonlySet<string>;
  selectedOnboardingAction: HeroOnboardingActionId | null;
  selectedInsightCategory: HeroInsightCategoryId | null;
  chatOpen: boolean;
  chatMinimized: boolean;
  onSelectOnboardingAction: (id: HeroOnboardingActionId) => void;
  onSelectInsightCategory: (id: HeroInsightCategoryId) => void;
  onCloseEntry: () => void;
  onCloseInsightsHub: () => void;
  onCloseReportWindow: (id: string) => void;
  onActivateWindow: (id: string) => void;
  onChatActivate: () => void;
  onChatMinimize: () => void;
  onChatRestore: () => void;
  onChatClose: () => void;
  onBookService: (title: string) => void;
  onEstimate: () => void;
  onUnlockMembership: () => void;
  heroLaunchId: number;
  heroConciergeMode?: HeroConciergeMode;
  heroAdvisorRoute?: AdvisorRouteContext;
}) {
  const { layerRef, bringToFront } = useHeroWindowManager();

  const showEntry =
    showReportSuite &&
    !!vehicleReport &&
    !closedReportWindows.has("entry");

  const showHub =
    showReportSuite &&
    !!vehicleReport &&
    insightsHubOpen &&
    !closedReportWindows.has("insights-hub");

  const layerActive =
    isLoading ||
    showEntry ||
    showHub ||
    visibleInsightWindows.size > 0 ||
    chatOpen;

  return (
    <div
      ref={layerRef}
      className="hero-window-layer"
      aria-live="polite"
    >
      <HeroWindowLayer active={layerActive}>
        {isLoading && (
          <div className="pointer-events-none absolute left-1/2 top-16 z-[45] -translate-x-1/2">
            <HeroReportSkeleton />
          </div>
        )}

        {showEntry && (
          <HeroMainEntryWindow
            report={vehicleReport}
            selectedAction={selectedOnboardingAction}
            dragConstraints={layerRef}
            onSelectAction={onSelectOnboardingAction}
            onClose={onCloseEntry}
            onActivate={() => {
              bringToFront("entry");
              onActivateWindow("entry");
            }}
          />
        )}

        {showHub && (
          <HeroInsightsHubWindow
            selectedCategory={selectedInsightCategory}
            dragConstraints={layerRef}
            onSelectCategory={onSelectInsightCategory}
            onClose={onCloseInsightsHub}
            onActivate={() => {
              bringToFront("insights-hub");
              onActivateWindow("insights-hub");
            }}
          />
        )}

        {showReportSuite && vehicleReport && (
          <HeroVehicleReportSuite
            report={vehicleReport}
            isMember={isMember}
            visibleWindowIds={visibleInsightWindows}
            closedWindows={closedReportWindows}
            dragConstraints={layerRef}
            onCloseWindow={onCloseReportWindow}
            onActivateWindow={(id) => {
              bringToFront(id);
              onActivateWindow(id);
            }}
            onEstimate={onEstimate}
            onBookService={onBookService}
            onUnlockMembership={onUnlockMembership}
          />
        )}

        {vehicleData && chatOpen && (
          <HeroAIChatModal
            vehicle={vehicleData}
            open={chatOpen}
            launchId={heroLaunchId}
            initialMode={heroConciergeMode}
            routeOverride={heroAdvisorRoute}
            dragConstraints={layerRef}
            onActivate={onChatActivate}
            onClose={onChatClose}
          />
        )}
      </HeroWindowLayer>
    </div>
  );
}

export function PremiumHero(props: PremiumHeroProps) {
  return (
    <HeroWindowManagerProvider>
      <PremiumHeroInner {...props} />
    </HeroWindowManagerProvider>
  );
}

function PremiumHeroInner({
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
  onCreateAccount,
  onBookNow,
  isMember = false,
}: PremiumHeroProps) {
  const [plateError, setPlateError] = useState<string | null>(null);
  const [plateShake, setPlateShake] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [vehicleReport, setVehicleReport] = useState<VehicleReport | null>(null);
  const [vehicleData, setVehicleData] = useState<VehicleResult | null>(null);
  const [lookupMatched, setLookupMatched] = useState(false);
  const [showReportSuite, setShowReportSuite] = useState(false);
  const [insightsHubOpen, setInsightsHubOpen] = useState(false);
  const [visibleInsightWindows, setVisibleInsightWindows] = useState<
    Set<string>
  >(() => new Set());
  const [selectedOnboardingAction, setSelectedOnboardingAction] =
    useState<HeroOnboardingActionId | null>(null);
  const [selectedInsightCategory, setSelectedInsightCategory] =
    useState<HeroInsightCategoryId | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(false);
  const [estimateOpen, setEstimateOpen] = useState(false);
  const [estimateMinimized, setEstimateMinimized] = useState(false);
  const [inspectionOpen, setInspectionOpen] = useState(false);
  const [inspectionMinimized, setInspectionMinimized] = useState(false);
  const [selectedService, setSelectedService] = useState<HeroServiceCard | null>(
    null
  );
  const [closedReportWindows, setClosedReportWindows] = useState<Set<string>>(
    () => new Set()
  );
  const [focusedWindowId, setFocusedWindowId] = useState<string | null>(null);

  const heroStageRef = useRef<HTMLDivElement>(null);
  const heroOverlayStageRef = useRef<HTMLDivElement>(null);
  const { bringToFront } = useHeroWindowManager();
  const { heroLaunchId, heroConciergeMode, advisorRoute: heroAdvisorRoute } =
    useAssistant();

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

  const resetLookupState = useCallback(() => {
    setIsLoading(false);
    setShowReportSuite(false);
    setVehicleReport(null);
    setVehicleData(null);
    setLookupMatched(false);
    setInsightsHubOpen(false);
    setVisibleInsightWindows(new Set());
    setSelectedOnboardingAction(null);
    setSelectedInsightCategory(null);
    setChatOpen(false);
    setChatMinimized(false);
    setEstimateOpen(false);
    setEstimateMinimized(false);
    setInspectionOpen(false);
    setInspectionMinimized(false);
    setClosedReportWindows(new Set());
    setFocusedWindowId(null);
  }, []);

  const focusBoostFor = useCallback(
    (id: string) => (focusedWindowId === id ? 40 : 0),
    [focusedWindowId]
  );

  const closeReportWindow = useCallback((id: string) => {
    setClosedReportWindows((prev) => new Set(prev).add(id));
    if (id === "insights-hub") {
      setInsightsHubOpen(false);
    }
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
      setInsightsHubOpen(false);
      setVisibleInsightWindows(new Set());
      setSelectedOnboardingAction(null);
      setSelectedInsightCategory(null);
      setClosedReportWindows(new Set());
      onReportReady?.(report);
    },
    [onReportReady]
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
    bringToFront("chat");
  }, [bringToFront]);

  useEffect(() => {
    if (!heroLaunchId || !vehicleData) return;
    openChat();
  }, [heroLaunchId, vehicleData, openChat]);

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

  const openInsightDetail = useCallback(
    (categoryId: HeroInsightCategoryId) => {
      const cat = HERO_INSIGHT_CATEGORIES.find((c) => c.id === categoryId);
      if (!cat) return;
      setSelectedInsightCategory(categoryId);
      setVisibleInsightWindows((prev) => {
        const next = new Set(prev);
        next.add(cat.windowId);
        return next;
      });
      setClosedReportWindows((prev) => {
        if (!prev.has(cat.windowId)) return prev;
        const next = new Set(prev);
        next.delete(cat.windowId);
        return next;
      });
      bringToFront(cat.windowId);
      activateWindow(cat.windowId);
    },
    [bringToFront, activateWindow]
  );

  const handleOnboardingAction = useCallback(
    (id: HeroOnboardingActionId) => {
      setSelectedOnboardingAction(id);
      switch (id) {
        case "quick_booking":
          onBookNow();
          break;
        case "service_advisor":
          openChat();
          break;
        case "vehicle_insights":
          setInsightsHubOpen(true);
          setClosedReportWindows((prev) => {
            if (!prev.has("insights-hub")) return prev;
            const next = new Set(prev);
            next.delete("insights-hub");
            return next;
          });
          bringToFront("insights-hub");
          activateWindow("insights-hub");
          break;
        case "create_account":
          onCreateAccount();
          break;
        default:
          break;
      }
    },
    [onBookNow, onCreateAccount, openChat, bringToFront, activateWindow]
  );

  const overlayActive = isLoading || estimateOpen || inspectionOpen;

  return (
    <section className="hero" id="hero-section" aria-labelledby="hero-heading">
      <div className="hero-container pt-2 sm:pt-4 lg:pt-2">
        <div className="hero-composition" ref={heroOverlayStageRef}>
          <div className="hero-stage-shell">
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
                    <p
                      className="mt-2 text-[11px] font-medium text-red-400/90"
                      role="alert"
                    >
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
                    <div
                      className="pointer-events-none absolute inset-0 z-[2] block bg-[linear-gradient(180deg,rgba(3,3,3,0.3)_0%,rgba(3,3,3,0.16)_38%,rgba(3,3,3,0.24)_72%,rgba(3,3,3,0.36)_100%),linear-gradient(90deg,rgba(3,3,3,0.32)_0%,rgba(3,3,3,0.12)_38%,rgba(3,3,3,0.04)_62%,transparent_100%)] max-sm:bg-[linear-gradient(180deg,rgba(3,3,3,0.24)_0%,rgba(3,3,3,0.12)_38%,rgba(3,3,3,0.2)_72%,rgba(3,3,3,0.32)_100%),linear-gradient(90deg,rgba(3,3,3,0.26)_0%,rgba(3,3,3,0.1)_38%,rgba(3,3,3,0.03)_62%,transparent_100%)] lg:hidden"
                      aria-hidden
                    />
                  </div>
                </div>
              </div>
            </div>
            </div>

            <PremiumHeroWindowStack
              showReportSuite={showReportSuite}
              vehicleReport={vehicleReport}
              vehicleData={vehicleData}
              isMember={isMember}
              isLoading={isLoading}
              insightsHubOpen={insightsHubOpen}
              visibleInsightWindows={visibleInsightWindows}
              closedReportWindows={closedReportWindows}
              selectedOnboardingAction={selectedOnboardingAction}
              selectedInsightCategory={selectedInsightCategory}
              chatOpen={chatOpen}
              chatMinimized={chatMinimized}
              onSelectOnboardingAction={handleOnboardingAction}
              onSelectInsightCategory={openInsightDetail}
              onCloseEntry={() => closeReportWindow("entry")}
              onCloseInsightsHub={() => closeReportWindow("insights-hub")}
              onCloseReportWindow={closeReportWindow}
              onActivateWindow={activateWindow}
              onChatActivate={() => {
                bringToFront("chat");
                activateWindow("chat");
              }}
              onChatMinimize={() => setChatMinimized(true)}
              onChatRestore={() => setChatMinimized(false)}
              onChatClose={() => {
                setChatOpen(false);
                setChatMinimized(false);
              }}
              onBookService={(title) => onHeroServiceSelect(title)}
              onEstimate={openEstimate}
              onUnlockMembership={onMembershipNote}
              heroLaunchId={heroLaunchId}
              heroConciergeMode={heroConciergeMode}
              heroAdvisorRoute={heroAdvisorRoute}
            />
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
            {vehicleData && (
              <>
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
