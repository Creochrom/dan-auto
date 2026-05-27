"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { ImagePlus, Send, X } from "lucide-react";
import type { VehicleResult } from "@/lib/types/vehicle";
import type { AdvisorRouteContext } from "@/lib/types/advisor-routing";
import type { HeroConciergeMode } from "@/lib/types/hero-concierge";
import type { HeroIntentCard } from "@/lib/types/hero-concierge";
import { HeroFloatingWindow } from "@/components/hero/HeroFloatingWindow";
import { ChatTimeline } from "@/features/chat/components/ChatTimeline";
import { useAdvisorChat } from "@/features/chat/hooks/useAdvisorChat";
import { useMediaUpload } from "@/features/booking/hooks/useMediaUpload";
import { AdvisorConciergeHub } from "@/features/chat/components/AdvisorConciergeHub";
import { HERO_INTENT_CARDS } from "@/lib/config/hero-concierge-copy";
import {
  getModeConversationStart,
  getSafeToDriveConversationStart,
} from "@/lib/config/concierge-mode-intros";
import {
  CALLBACK_CHAT_ERROR,
  CALLBACK_CHAT_SENDING,
  CALLBACK_CHAT_SUCCESS,
  CALLBACK_CONFIRM_CHIP_ID,
} from "@/lib/config/callback-flow-copy";
import { AdvisorHandoffNoticeBubble } from "@/features/chat/components/AdvisorHandoffNoticeBubble";
import {
  looksLikePhoneInput,
  parseUkPhone,
  UK_PHONE_CONFIRMED_PREFIX,
  UK_PHONE_INVALID_HINT,
} from "@/lib/validation/uk-phone";
import { vehicleSnapshotFromLegacy } from "@/lib/services/advisor-routing-prompt";
import { stripPlate } from "@/lib/format-plate";
import type { SuggestionChip } from "@/lib/types/intake";
import {
  legacyRightPosition,
  type HeroWindowPosition,
} from "@/lib/hero-window-position";

const CUSTOMER_NAME_KEY = "dan-auto-advisor-customer-name";

type Props = {
  vehicle: VehicleResult;
  open: boolean;
  stackDepth?: number;
  entranceDelay?: number;
  dragConstraints?: RefObject<HTMLElement | null>;
  defaultPosition?: HeroWindowPosition;
  onClose: () => void;
  onActivate?: () => void;
  /** Bumped when opened from elsewhere on the page — starts a fresh concierge flow. */
  launchId?: number;
  initialMode?: HeroConciergeMode;
  routeOverride?: AdvisorRouteContext | null;
};

function routeForMode(
  vehicle: VehicleResult,
  mode: HeroConciergeMode
): AdvisorRouteContext {
  const base = {
    entry_point: "hero_ai_assistant" as const,
    surface: "hero_ai_assistant" as const,
    handoff_policy: "explicit_only" as const,
    vehicle_data: vehicleSnapshotFromLegacy({
      reg: vehicle.reg,
      makeModel: vehicle.makeModel,
      meta: vehicle.meta,
    }),
    concierge_mode: mode === "hub" ? undefined : mode,
  };

  switch (mode) {
    case "pricing":
      return { ...base, intent: "general", concierge_mode: "pricing" };
    case "callback":
      return { ...base, intent: "general", concierge_mode: "callback" };
    case "booking":
      return { ...base, intent: "booking", concierge_mode: "booking" };
    case "quick_question":
      return { ...base, intent: "general", concierge_mode: "quick_question" };
    case "diagnostic":
    default:
      return { ...base, intent: "diagnostic_help", concierge_mode: "diagnostic" };
  }
}

function mapExternalRoute(
  vehicle: VehicleResult,
  override?: AdvisorRouteContext | null,
  mode?: HeroConciergeMode
): AdvisorRouteContext {
  if (override) {
    return {
      handoff_policy: "explicit_only",
      ...override,
      vehicle_data:
        override.vehicle_data ??
        vehicleSnapshotFromLegacy({
          reg: vehicle.reg,
          makeModel: vehicle.makeModel,
          meta: vehicle.meta,
        }),
    };
  }
  return routeForMode(vehicle, mode ?? "hub");
}

export function HeroAIChatModal({
  vehicle,
  open,
  stackDepth = 2,
  entranceDelay = 0,
  dragConstraints,
  defaultPosition = legacyRightPosition({ x: 20, y: 88 }),
  onClose,
  onActivate,
  launchId = 0,
  initialMode,
  routeOverride,
}: Props) {
  const [draft, setDraft] = useState("");
  const [conciergeMode, setConciergeMode] = useState<HeroConciergeMode>("hub");
  const [selectedIntentId, setSelectedIntentId] = useState<string | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [rememberedName, setRememberedName] = useState("");
  const [welcomeBack, setWelcomeBack] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastLaunchId = useRef(launchId);

  const regCanon = stripPlate(vehicle.reg);

  const advisorRoute = useMemo(() => {
    const base = mapExternalRoute(vehicle, routeOverride, conciergeMode);
    if (selectedIntentId === "safe_to_drive") {
      return { ...base, concierge_focus: "safe_to_drive" as const };
    }
    return base;
  }, [vehicle, routeOverride, conciergeMode, selectedIntentId]);

  const sessionKey = `dan-auto-hero-advisor-${regCanon || "unknown"}`;
  const media = useMediaUpload();

  const uploadsInProgress = media.items.some(
    (i) => i.status === "uploading" || i.status === "pending"
  );
  const imageCount = media.items.length;
  const latestImage = imageCount ? media.items[imageCount - 1] : null;

  const {
    messages,
    isTyping,
    typingLabel,
    error,
    send,
    sendQuickReply,
    bootstrap,
    reset: resetChat,
    submitWorkshopHandoff,
    intakeSubmitState,
    leadDraft,
    callbackReady,
    appendLocalAssistant,
    appendAssistantWithChips,
  } = useAdvisorChat({
    sessionStorageKey: sessionKey,
    enabled: open,
    registrationHint: vehicle.reg,
    advisorRoute,
    uploadIds: media.uploadIds,
    introMode: "workshop",
    autoSubmitIntake: false,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(CUSTOMER_NAME_KEY);
    if (stored) setRememberedName(stored);
  }, []);

  useEffect(() => {
    if (open) void bootstrap();
  }, [open, bootstrap]);

  useEffect(() => {
    if (galleryOpen && imageCount === 0) setGalleryOpen(false);
  }, [galleryOpen, imageCount]);

  const beginModeConversation = useCallback(
    (card: HeroIntentCard) => {
      setWelcomeBack(false);
      setConciergeMode(card.mode);
      setSelectedIntentId(card.id);

      const start =
        card.id === "safe_to_drive"
          ? getSafeToDriveConversationStart(vehicle)
          : getModeConversationStart(card.mode, vehicle);

      appendAssistantWithChips(start.message, start.chips);
    },
    [vehicle, appendAssistantWithChips]
  );

  useEffect(() => {
    if (launchId === lastLaunchId.current) return;
    lastLaunchId.current = launchId;
    if (!initialMode || initialMode === "hub") return;

    const card =
      routeOverride?.concierge_focus === "safe_to_drive"
        ? HERO_INTENT_CARDS.find((c) => c.id === "safe_to_drive")
        : HERO_INTENT_CARDS.find((c) => c.mode === initialMode);

    if (card) beginModeConversation(card);
  }, [launchId, initialMode, routeOverride?.concierge_focus, beginModeConversation]);

  const resetConciergeUi = useCallback(() => {
    setConciergeMode("hub");
    setSelectedIntentId(null);
    setDraft("");
    setGalleryOpen(false);
    setWelcomeBack(true);
    media.clear();
    resetChat();
  }, [media, resetChat]);

  const startIntent = useCallback(
    (card: HeroIntentCard) => {
      beginModeConversation(card);
    },
    [beginModeConversation]
  );

  const completeCallbackHandoff = useCallback(async () => {
    if (intakeSubmitState === "sending" || intakeSubmitState === "sent") {
      return intakeSubmitState === "sent";
    }

    const name = leadDraft.name?.trim();
    const phone = leadDraft.phone?.trim();
    if (!name || !phone) return false;

    if (typeof window !== "undefined") {
      localStorage.setItem(CUSTOMER_NAME_KEY, name);
    }
    setRememberedName(name);

    return submitWorkshopHandoff({
      name,
      phone,
      preferredCallbackTime:
        leadDraft.callbackWindow ?? leadDraft.preferredDate ?? undefined,
      successNotice: CALLBACK_CHAT_SUCCESS,
      errorNotice: CALLBACK_CHAT_ERROR,
    });
  }, [leadDraft, submitWorkshopHandoff, intakeSubmitState]);

  const handleQuickReply = useCallback(
    (chip: SuggestionChip) => {
      if (chip.id === CALLBACK_CONFIRM_CHIP_ID) {
        if (intakeSubmitState === "sending" || intakeSubmitState === "sent") {
          return;
        }
        void completeCallbackHandoff();
        return;
      }
      if (chip.id === "escalate-callback") {
        setConciergeMode("callback");
        void send(chip.message, {
          displayContent: chip.label,
          source: "quick_reply",
          registration: vehicle.reg,
        });
        return;
      }
      if (chip.id === "escalate-continue") {
        void send(chip.message, {
          displayContent: chip.label,
          source: "quick_reply",
          registration: vehicle.reg,
        });
        return;
      }
      sendQuickReply(chip, vehicle.reg);
    },
    [send, sendQuickReply, vehicle.reg, completeCallbackHandoff, intakeSubmitState]
  );

  useEffect(() => {
    if (conciergeMode !== "callback") return;
    if (!callbackReady || intakeSubmitState === "sent" || intakeSubmitState === "sending" || intakeSubmitState === "error") {
      return;
    }
    void completeCallbackHandoff();
  }, [
    callbackReady,
    conciergeMode,
    intakeSubmitState,
    completeCallbackHandoff,
  ]);

  const handleSend = useCallback(() => {
    const text = draft.trim();
    if (!text || isTyping || uploadsInProgress) return;
    setDraft("");

    if (conciergeMode === "hub") {
      setConciergeMode("quick_question");
    }

    if (conciergeMode === "callback" && looksLikePhoneInput(text)) {
      const parsed = parseUkPhone(text);
      if (!parsed.valid) {
        appendLocalAssistant(UK_PHONE_INVALID_HINT);
        return;
      }
      void send(`${UK_PHONE_CONFIRMED_PREFIX} ${parsed.national}.`, {
        displayContent: parsed.display,
        registration: vehicle.reg,
      });
      return;
    }

    void send(text, { registration: vehicle.reg });
  }, [
    draft,
    isTyping,
    send,
    uploadsInProgress,
    vehicle.reg,
    conciergeMode,
    appendLocalAssistant,
  ]);

  const transformCallbackChips = useCallback(
    (chips: SuggestionChip[]): SuggestionChip[] =>
      chips.map((chip) => {
        if (chip.id !== CALLBACK_CONFIRM_CHIP_ID) return chip;
        if (intakeSubmitState === "sent") {
          return { ...chip, label: "Request sent" };
        }
        if (intakeSubmitState === "sending") {
          return { ...chip, label: "Sending…" };
        }
        return chip;
      }),
    [intakeSubmitState]
  );

  const isCallbackChipDisabled = useCallback(
    (chip: SuggestionChip) =>
      chip.id === CALLBACK_CONFIRM_CHIP_ID &&
      (intakeSubmitState === "sending" || intakeSubmitState === "sent"),
    [intakeSubmitState]
  );

  const callbackPendingNotice =
    conciergeMode === "callback" && intakeSubmitState === "sending" ? (
      <AdvisorHandoffNoticeBubble
        message={{
          id: "callback-pending",
          role: "assistant",
          content: CALLBACK_CHAT_SENDING,
          createdAt: new Date().toISOString(),
          noticeVariant: "pending",
        }}
      />
    ) : null;

  const showHub = messages.length === 0 && conciergeMode === "hub";

  const intro = showHub ? (
    <AdvisorConciergeHub
      onSelectIntent={startIntent}
      disabled={isTyping}
      customerName={rememberedName}
      isReturning={welcomeBack}
    />
  ) : null;

  const composerPlaceholder =
    selectedIntentId === "safe_to_drive"
      ? "Describe what the vehicle is doing…"
      : conciergeMode === "callback"
        ? "Reply to the assistant…"
        : conciergeMode === "booking"
          ? "Service or MOT question…"
          : conciergeMode === "pricing"
            ? "Describe the repair or symptom…"
            : conciergeMode === "quick_question"
              ? "Your quick question…"
              : "Describe the issue…";

  const openFilePicker = useCallback(() => {
    if (isTyping) return;
    fileInputRef.current?.click();
  }, [isTyping]);

  const galleryPosition: HeroWindowPosition = {
    ...defaultPosition,
    y: defaultPosition.y - 28,
  };

  const handleReset = useCallback(() => {
    resetConciergeUi();
  }, [resetConciergeUi]);

  if (!open) return null;

  return (
    <>
      <HeroFloatingWindow
        title="24/7 Service Assistant"
        windowId="chat"
        chromeless
        flatPanel
        stackDepth={stackDepth}
        entranceDelay={entranceDelay}
        dragConstraints={dragConstraints}
        defaultPosition={defaultPosition}
        width={380}
        onReset={handleReset}
        onClose={onClose}
        onActivate={onActivate}
        ariaLabel="24/7 Service Assistant"
      >
        <div className="hero-advisor-chat flex min-h-[280px] max-h-[min(52vh,420px)] sm:max-h-[min(58vh,480px)] flex-col">
          <header className="hero-advisor-chat__header flex shrink-0 items-center justify-between gap-3 px-3 py-1.5 sm:px-4">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#d4a63c]/90">
              {vehicle.reg}
            </span>
            {!vehicle.unknown && (
              <span className="min-w-0 truncate text-right text-[11px] font-medium text-zinc-400">
                {vehicle.makeModel}
              </span>
            )}
          </header>

          <ChatTimeline
            messages={messages}
            isTyping={isTyping}
            typingLabel={typingLabel}
            onQuickReply={handleQuickReply}
            error={
              conciergeMode === "callback" && intakeSubmitState === "error"
                ? null
                : error
            }
            theme="gold"
            quickRepliesDisabled={
              isTyping || uploadsInProgress || intakeSubmitState === "sending"
            }
            intro={intro}
            className="min-h-0 flex-1"
            handoffPendingNotice={callbackPendingNotice}
            transformChips={
              conciergeMode === "callback" ? transformCallbackChips : undefined
            }
            isChipDisabled={
              conciergeMode === "callback" ? isCallbackChipDisabled : undefined
            }
            onHandoffRetry={
              conciergeMode === "callback" && intakeSubmitState === "error"
                ? () => void completeCallbackHandoff()
                : undefined
            }
          />

          <div className="hero-advisor-chat__composer shrink-0 border-t border-white/[0.06] px-3 pb-2.5 pt-2 sm:px-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              className="sr-only"
              disabled={isTyping}
              onChange={(e) => {
                void media.addFiles(e.target.files ?? []);
                e.currentTarget.value = "";
              }}
            />

            <form
              className="flex items-stretch gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
            >
              <div className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-lg border border-white/[0.08] bg-[#0a0a0a]/90 px-2 focus-within:border-[#d4a63c]/35 focus-within:ring-1 focus-within:ring-[#d4a63c]/20">
                <div className="flex shrink-0 items-center gap-1.5">
                  {latestImage && imageCount > 0 ? (
                    <button
                      type="button"
                      className="relative h-8 w-8 overflow-hidden rounded-md border border-white/[0.08] bg-black/40 transition hover:border-[#d4a63c]/45"
                      onClick={() => setGalleryOpen(true)}
                      aria-label="View uploaded images"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={latestImage.previewUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute bottom-0 right-0 rounded-tl-md bg-black/70 px-1 py-0.5 text-[9px] font-bold text-[#e8d4a8]">
                        {imageCount}
                      </span>
                    </button>
                  ) : null}

                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-white/[0.08] bg-black/30 text-[#d4a63c]/85 transition hover:border-[#d4a63c]/55 hover:bg-[#d4a63c]/[0.06] disabled:opacity-40"
                    onClick={openFilePicker}
                    disabled={isTyping}
                    aria-label="Attach images"
                  >
                    <ImagePlus className="h-4 w-4" aria-hidden />
                  </button>
                </div>

                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={composerPlaceholder}
                  className="min-w-0 flex-1 bg-transparent px-0 text-[13px] text-white outline-none placeholder:text-zinc-600"
                  disabled={isTyping || uploadsInProgress}
                />
              </div>

              <button
                type="submit"
                disabled={isTyping || uploadsInProgress || !draft.trim()}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#d4a63c] text-black transition-opacity disabled:opacity-45"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" aria-hidden />
              </button>
            </form>
          </div>
        </div>
      </HeroFloatingWindow>

      {galleryOpen && imageCount > 0 ? (
        <HeroFloatingWindow
          windowId="chat-gallery"
          title="Uploaded images"
          chromeless
          flatPanel
          flatPanelTier="secondary"
          stackDepth={stackDepth + 1}
          entranceDelay={entranceDelay + 0.02}
          dragConstraints={dragConstraints}
          defaultPosition={galleryPosition}
          width={420}
          onClose={() => setGalleryOpen(false)}
          ariaLabel="Uploaded images"
        >
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                For workshop review
              </p>
              <p className="text-[11px] font-medium text-[#d4a63c]/90">
                {imageCount} attached
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {media.items.map((item) => (
                <div
                  key={item.localId}
                  className="relative aspect-square overflow-hidden rounded-lg border border-white/[0.08] bg-black/40 transition hover:border-[#d4a63c]/35"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.previewUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />

                  <button
                    type="button"
                    className="absolute right-1 top-1 inline-flex h-7 w-7 items-center justify-center rounded-md bg-black/70 text-white/90 ring-1 ring-white/10 backdrop-blur hover:bg-black/90"
                    onClick={() => media.remove(item.localId)}
                    aria-label={`Remove ${item.file.name}`}
                    disabled={
                      item.status === "uploading" || item.status === "pending"
                    }
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </HeroFloatingWindow>
      ) : null}
    </>
  );
}
