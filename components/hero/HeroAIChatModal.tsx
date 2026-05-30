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
import type { VehicleReport } from "@/lib/types/vehicle-report";
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
  CALLBACK_CHAT_SUCCESS,
  CALLBACK_CONFIRM_CHIP_ID,
} from "@/lib/config/callback-flow-copy";
import {
  applyBookingJourneyChip,
  applyParsedAppointmentPreference,
  beginContextualBookingHandoff,
  BOOKING_DAY_CHIPS,
  BOOKING_NEED_CHIPS,
  isBookingJourneyChip,
  parseAppointmentPreference,
  resolveBookingJourneyProgress,
  resolveContextualBookingService,
  type ContextualBookingSource,
} from "@/lib/booking/booking-journey";
import {
  BOOKING_CONFIRM_CHIP_ID,
  BOOKING_CHANGE_CONTACT_CHIP_ID,
  BOOKING_CHANGE_DAY_CHIP_ID,
  BOOKING_CHANGE_SERVICE_CHIP_ID,
  BOOKING_NOT_NOW_ACK,
  BOOKING_USE_DIFFERENT_PHONE_CHIP_ID,
  BOOKING_USE_STORED_PHONE_CHIP_ID,
} from "@/lib/config/booking-flow-copy";
import { BookingHandoffReview } from "@/components/hero/BookingHandoffReview";
import {
  BOOKING_USE_DIFFERENT_PHONE_CHIP,
  BOOKING_USE_STORED_PHONE_CHIP,
  type BookingHandoffStep,
  bookingSlotFingerprint,
  buildBookingPreviewSummary,
  formatBookingReviewChatNudge,
  isReviewReopenRequest,
  phoneConfirmMessage,
  resolveStoredPhone,
} from "@/lib/services/booking-preview";
import {
  bookingTraceStage,
  createBookingTraceId,
  traceValidationResult,
} from "@/lib/logging/booking-trace";
import { SystemStatusBanner } from "@/features/chat/components/SystemStatusBanner";
import { resolveSystemBanner } from "@/lib/config/system-status-copy";
import {
  looksLikePhoneInput,
  parseUkPhone,
  UK_PHONE_CONFIRMED_PREFIX,
  UK_PHONE_INVALID_HINT,
} from "@/lib/validation/uk-phone";
import { validateLeadContact, validateCustomerPhone, isPlaceholderContactInput } from "@/lib/validation/advisor-contact";
import {
  PRICING_ACTION_BOOK,
  PRICING_ACTION_CALLBACK,
  PRICING_ACTION_QUESTION,
  validateLeadCompletion,
} from "@/lib/services/advisor-workflow";
import {
  DIAGNOSTIC_ACTION_BOOK,
  DIAGNOSTIC_ACTION_CALLBACK,
  DIAGNOSTIC_ACTION_ESTIMATE,
  DIAGNOSTIC_ACTION_RECOVERY,
  diagnosticSummaryReady,
} from "@/lib/intake/unified-intake";
import { createEmptyStructuredIntake } from "@/lib/types/structured-intake";
import { isAffirmativeBookingConfirmation } from "@/lib/services/booking-handoff";
import {
  isAffirmativeCallbackConfirmation,
  isCallbackHandoffReady,
} from "@/lib/services/callback-handoff";
import { vehicleSnapshotForAdvisor } from "@/lib/services/advisor-routing-prompt";
import { stripPlate } from "@/lib/format-plate";
import type { SuggestionChip } from "@/lib/types/intake";
import {
  legacyRightPosition,
  type HeroWindowPosition,
} from "@/lib/hero-window-position";

const CUSTOMER_NAME_KEY = "dan-auto-advisor-customer-name";

type Props = {
  vehicle: VehicleResult;
  vehicleReport?: VehicleReport | null;
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
  vehicleReport: VehicleReport | null | undefined,
  mode: HeroConciergeMode
): AdvisorRouteContext {
  const base = {
    entry_point: "hero_ai_assistant" as const,
    surface: "hero_ai_assistant" as const,
    handoff_policy: "explicit_only" as const,
    vehicle_data: vehicleSnapshotForAdvisor(vehicleReport, {
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
  vehicleReport: VehicleReport | null | undefined,
  override?: AdvisorRouteContext | null,
  mode?: HeroConciergeMode
): AdvisorRouteContext {
  if (override) {
    return {
      handoff_policy: "explicit_only",
      ...override,
      vehicle_data:
        override.vehicle_data ??
        vehicleSnapshotForAdvisor(vehicleReport, {
          reg: vehicle.reg,
          makeModel: vehicle.makeModel,
          meta: vehicle.meta,
        }),
    };
  }
  return routeForMode(vehicle, vehicleReport, mode ?? "hub");
}

export function HeroAIChatModal({
  vehicle,
  vehicleReport = null,
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
  const [bookingPhoneConfirmed, setBookingPhoneConfirmed] = useState(false);
  const [bookingHandoffStep, setBookingHandoffStep] = useState<BookingHandoffStep>("idle");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastLaunchId = useRef(launchId);
  const bookingHandoffPromptRef = useRef<"none" | "phone" | "preview">("none");
  const bookingAwaitingNewPhoneRef = useRef(false);
  const bookingReviewDismissedRef = useRef(false);
  const bookingSlotFingerprintRef = useRef("");

  const bookingTraceRef = useRef<string | null>(null);
  const regCanon = stripPlate(vehicle.reg);

  const advisorRoute = useMemo(() => {
    const base = mapExternalRoute(vehicle, vehicleReport, routeOverride, conciergeMode);
    if (selectedIntentId === "safe_to_drive") {
      return { ...base, concierge_focus: "safe_to_drive" as const };
    }
    return base;
  }, [vehicle, vehicleReport, routeOverride, conciergeMode, selectedIntentId]);

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
    submitBookingHandoff,
    intakeSubmitState,
    handoffResult,
    leadDraft,
    structuredIntake,
    appendLocalAssistant,
    appendAssistantWithChips,
    appendLocalUser,
    patchLeadDraft,
    patchStructuredIntake,
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

  const bookingPreviewSummary = useMemo(() => {
    if (conciergeMode !== "booking") return null;
    if (bookingHandoffStep !== "preview" && bookingHandoffStep !== "change_details") {
      return null;
    }
    const intake = structuredIntake ?? createEmptyStructuredIntake();
    const phone = resolveStoredPhone(intake, leadDraft);
    if (!phone) return null;
    return buildBookingPreviewSummary({
      intake,
      leadDraft,
      registrationHint: vehicle.reg,
      phone,
    });
  }, [conciergeMode, bookingHandoffStep, structuredIntake, leadDraft, vehicle.reg]);

  useEffect(() => {
    if (conciergeMode !== "booking" || intakeSubmitState !== "idle" || isTyping) return;

    const intake = structuredIntake ?? createEmptyStructuredIntake();
    const progress = resolveBookingJourneyProgress(intake, leadDraft);

    const fingerprint = bookingSlotFingerprint(intake, leadDraft);
    if (fingerprint !== bookingSlotFingerprintRef.current) {
      bookingSlotFingerprintRef.current = fingerprint;
      if (bookingReviewDismissedRef.current) {
        bookingReviewDismissedRef.current = false;
        bookingHandoffPromptRef.current = "none";
      }
    }

    if (progress.step !== "ready") {
      setBookingHandoffStep("idle");
      setBookingPhoneConfirmed(false);
      bookingHandoffPromptRef.current = "none";
      return;
    }

    const validation = validateLeadCompletion("booking", intake, leadDraft, vehicle.reg);
    if (!validation.canSubmit) {
      if (
        progress.serviceSelected &&
        progress.daySelected &&
        progress.windowSelected &&
        !validation.phone &&
        !bookingAwaitingNewPhoneRef.current &&
        bookingHandoffPromptRef.current !== "phone"
      ) {
        bookingHandoffPromptRef.current = "phone";
        appendLocalAssistant(
          "Almost done — please type your UK mobile number so the workshop can confirm your appointment."
        );
      }
      return;
    }

    const phone = resolveStoredPhone(intake, leadDraft);
    if (!phone) return;

    if (rememberedName && !leadDraft.name?.trim()) {
      patchLeadDraft({ name: rememberedName });
    }

    if (!bookingPhoneConfirmed && bookingHandoffPromptRef.current !== "phone") {
      bookingHandoffPromptRef.current = "phone";
      setBookingHandoffStep("phone_confirm");
      appendAssistantWithChips(phoneConfirmMessage(phone.slice(-4)), [
        BOOKING_USE_STORED_PHONE_CHIP,
        BOOKING_USE_DIFFERENT_PHONE_CHIP,
      ]);
      return;
    }

    if (
      bookingPhoneConfirmed &&
      !bookingReviewDismissedRef.current &&
      bookingHandoffPromptRef.current !== "preview"
    ) {
      bookingHandoffPromptRef.current = "preview";
      setBookingHandoffStep("preview");
      appendLocalAssistant(formatBookingReviewChatNudge());
    }
  }, [
    conciergeMode,
    intakeSubmitState,
    isTyping,
    structuredIntake,
    leadDraft,
    vehicle.reg,
    bookingPhoneConfirmed,
    rememberedName,
    appendAssistantWithChips,
    appendLocalAssistant,
    patchLeadDraft,
  ]);

  const resetBookingReviewOnly = useCallback(() => {
    setBookingHandoffStep("idle");
    bookingHandoffPromptRef.current = "none";
    bookingReviewDismissedRef.current = false;
  }, []);

  const resetBookingHandoffFlow = useCallback(() => {
    setBookingPhoneConfirmed(false);
    setBookingHandoffStep("idle");
    bookingHandoffPromptRef.current = "none";
    bookingAwaitingNewPhoneRef.current = false;
    bookingReviewDismissedRef.current = false;
  }, []);

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
    setBookingPhoneConfirmed(false);
    setBookingHandoffStep("idle");
    bookingHandoffPromptRef.current = "none";
    bookingAwaitingNewPhoneRef.current = false;
    bookingReviewDismissedRef.current = false;
    bookingSlotFingerprintRef.current = "";
    media.clear();
    resetChat();
  }, [media, resetChat]);

  const startIntent = useCallback(
    (card: HeroIntentCard) => {
      beginModeConversation(card);
    },
    [beginModeConversation]
  );

  const buildRouteForMode = useCallback(
    (mode: HeroConciergeMode): AdvisorRouteContext => {
      const base = mapExternalRoute(vehicle, vehicleReport, routeOverride, mode);
      if (selectedIntentId === "safe_to_drive" && mode === "quick_question") {
        return { ...base, concierge_focus: "safe_to_drive" as const };
      }
      return base;
    },
    [vehicle, vehicleReport, routeOverride, selectedIntentId]
  );

  const sendWithMode = useCallback(
    (mode: HeroConciergeMode, chip: SuggestionChip) => {
      setConciergeMode(mode);
      void send(chip.message, {
        displayContent: chip.label,
        source: "quick_reply",
        registration: vehicle.reg,
        advisorRouteOverride: buildRouteForMode(mode),
      });
    },
    [send, vehicle.reg, buildRouteForMode]
  );

  const completeCallbackHandoff = useCallback(async () => {
    if (intakeSubmitState === "sending" || intakeSubmitState === "sent") {
      return intakeSubmitState === "sent";
    }

    const name = leadDraft.name?.trim();
    const phone = leadDraft.phone?.trim();
    const contact = validateLeadContact(name, phone);
    if (!contact.canSubmit) {
      appendLocalAssistant(
        "Before I can send this to the workshop, I need your full name and a valid UK phone number."
      );
      return false;
    }

    const phoneCheck = validateCustomerPhone(phone);
    if (!phoneCheck.valid) {
      appendLocalAssistant(UK_PHONE_INVALID_HINT);
      return false;
    }

    if (typeof window !== "undefined" && name) {
      localStorage.setItem(CUSTOMER_NAME_KEY, name);
    }
    setRememberedName(name ?? "");

    return submitWorkshopHandoff({
      name: name!,
      phone: phoneCheck.normalized,
      preferredCallbackTime:
        leadDraft.callbackWindow ?? leadDraft.preferredDate ?? undefined,
      successNotice: CALLBACK_CHAT_SUCCESS,
      errorNotice: CALLBACK_CHAT_ERROR,
    });
  }, [leadDraft, submitWorkshopHandoff, intakeSubmitState, appendLocalAssistant]);

  const handleBookingChangeDetails = useCallback(() => {
    setBookingHandoffStep("change_details");
  }, []);

  const handleBookingNotNow = useCallback(() => {
    bookingReviewDismissedRef.current = true;
    bookingHandoffPromptRef.current = "preview";
    setBookingHandoffStep("dismissed");
    appendLocalAssistant(BOOKING_NOT_NOW_ACK);
  }, [appendLocalAssistant]);

  const handleBookingChangeAppointment = useCallback(() => {
    resetBookingReviewOnly();
    patchLeadDraft({ preferredDate: undefined, callbackWindow: undefined });
    patchStructuredIntake({ preferredBookingTime: "" });
    appendAssistantWithChips("When would you like to come in?", BOOKING_DAY_CHIPS);
  }, [
    resetBookingReviewOnly,
    patchLeadDraft,
    patchStructuredIntake,
    appendAssistantWithChips,
  ]);

  const handleBookingChangeDay = useCallback(() => {
    handleBookingChangeAppointment();
  }, [handleBookingChangeAppointment]);

  const handleBookingChangeContact = useCallback(() => {
    setBookingPhoneConfirmed(false);
    resetBookingReviewOnly();
    bookingAwaitingNewPhoneRef.current = true;
    void send("I'd like to change my contact number", {
      displayContent: "Change contact number",
      source: "quick_reply",
      registration: vehicle.reg,
    });
  }, [resetBookingReviewOnly, send, vehicle.reg]);

  const handleBookingChangeService = useCallback(() => {
    resetBookingReviewOnly();
    patchLeadDraft({
      problemDescription: undefined,
      preferredDate: undefined,
      callbackWindow: undefined,
      urgency: undefined,
    });
    patchStructuredIntake({ preferredBookingTime: "" });
    appendAssistantWithChips("What do you need help with today?", BOOKING_NEED_CHIPS);
  }, [resetBookingReviewOnly, patchLeadDraft, patchStructuredIntake, appendAssistantWithChips]);

  const handleBackToReview = useCallback(() => {
    setBookingHandoffStep("preview");
  }, []);

  const startContextualBookingHandoff = useCallback(
    (chip: SuggestionChip, source: ContextualBookingSource) => {
      setConciergeMode("booking");
      resetBookingHandoffFlow();
      appendLocalUser(chip.message, chip.label);
      const intake = structuredIntake ?? createEmptyStructuredIntake();
      const result = beginContextualBookingHandoff({ intake, leadDraft, source });
      patchLeadDraft(result.leadDraftPatch);
      if (result.structuredPatch) {
        patchStructuredIntake(result.structuredPatch);
      }
      if (result.assistantMessage && result.nextChips?.length) {
        appendAssistantWithChips(result.assistantMessage, result.nextChips);
      } else if (result.assistantMessage) {
        appendLocalAssistant(result.assistantMessage);
      }
    },
    [
      structuredIntake,
      leadDraft,
      resetBookingHandoffFlow,
      appendLocalUser,
      appendAssistantWithChips,
      appendLocalAssistant,
      patchLeadDraft,
      patchStructuredIntake,
    ]
  );

  const advanceContextualBookingFromText = useCallback(
    (text: string, source: ContextualBookingSource, displayContent?: string) => {
      const intake = structuredIntake ?? createEmptyStructuredIntake();
      const parsed = parseAppointmentPreference(text);
      if (!parsed) return false;

      setConciergeMode("booking");
      resetBookingHandoffFlow();
      appendLocalUser(text, displayContent ?? text);

      const service = resolveContextualBookingService(intake, leadDraft, source);
      const mergedDraft = {
        ...leadDraft,
        problemDescription: service,
        preferredDate: parsed.preferredDate ?? leadDraft.preferredDate,
        callbackWindow: parsed.callbackWindow ?? leadDraft.callbackWindow,
      };
      patchLeadDraft({
        problemDescription: service,
        preferredDate: mergedDraft.preferredDate,
        callbackWindow: mergedDraft.callbackWindow,
      });

      const result = applyParsedAppointmentPreference(parsed, mergedDraft);
      if (result.leadDraftPatch) {
        patchLeadDraft(result.leadDraftPatch);
      }
      if (result.structuredPatch) {
        patchStructuredIntake(result.structuredPatch);
      }
      if (result.assistantMessage && result.nextChips?.length) {
        appendAssistantWithChips(result.assistantMessage, result.nextChips);
      } else if (result.assistantMessage) {
        appendLocalAssistant(result.assistantMessage);
      }
      return true;
    },
    [
      structuredIntake,
      leadDraft,
      resetBookingHandoffFlow,
      appendLocalUser,
      appendAssistantWithChips,
      appendLocalAssistant,
      patchLeadDraft,
      patchStructuredIntake,
    ]
  );

  const completeBookingHandoff = useCallback(async () => {
    const traceId = createBookingTraceId();
    bookingTraceRef.current = traceId;

    bookingTraceStage("1_user_action", traceId, {
      action: "completeBookingHandoff",
      conciergeMode: "booking",
      intakeSubmitState,
    });

    if (intakeSubmitState === "sending" || intakeSubmitState === "sent") {
      bookingTraceStage("1_user_action", traceId, {
        skipped: true,
        reason: intakeSubmitState,
      });
      return intakeSubmitState === "sent";
    }

    const intake = structuredIntake ?? createEmptyStructuredIntake();
    const validation = validateLeadCompletion("booking", intake, leadDraft, vehicle.reg);
    bookingTraceStage("2_readiness_validation", traceId, {
      source: "HeroAIChatModal.completeBookingHandoff",
      validation: traceValidationResult(validation),
    });

    if (!validation.canSubmit) {
      const missing: string[] = [];
      if (!validation.issue) missing.push("service type");
      if (!validation.customerName) missing.push("your full name");
      if (!validation.phone) missing.push("a valid UK mobile number");
      if (!validation.day) missing.push("preferred day");
      if (!validation.time) missing.push("preferred time window");
      bookingTraceStage("1_user_action", traceId, {
        blocked: true,
        missing,
      });
      appendLocalAssistant(
        `Before I can send this booking request, I still need ${missing.join(", ")}.`
      );
      return false;
    }

    const phone = resolveStoredPhone(intake, leadDraft);
    if (phone && !bookingPhoneConfirmed) {
      bookingHandoffPromptRef.current = "none";
      setBookingHandoffStep("phone_confirm");
      appendAssistantWithChips(phoneConfirmMessage(phone.slice(-4)), [
        BOOKING_USE_STORED_PHONE_CHIP,
        BOOKING_USE_DIFFERENT_PHONE_CHIP,
      ]);
      return false;
    }

    if (bookingHandoffStep !== "preview" && bookingHandoffStep !== "change_details") {
      appendLocalAssistant(
        "Please review your booking request in the panel below, then tap Send booking request when you're ready."
      );
      return false;
    }

    const name = leadDraft.name?.trim();
    const phoneValue = phone ?? leadDraft.phone?.trim();
    const phoneCheck = validateCustomerPhone(phoneValue);
    if (!phoneCheck.valid) {
      appendLocalAssistant(UK_PHONE_INVALID_HINT);
      return false;
    }

    if (typeof window !== "undefined" && name) {
      localStorage.setItem(CUSTOMER_NAME_KEY, name);
    }
    setRememberedName(name ?? "");

    return submitBookingHandoff({
      confirmationText: "Yes, please send my booking request",
      displayContent: "Yes",
      name: name!,
      phone: phoneCheck.normalized,
      traceId,
      userAction: "completeBookingHandoff",
    });
  }, [
    structuredIntake,
    leadDraft,
    vehicle.reg,
    submitBookingHandoff,
    intakeSubmitState,
    appendLocalAssistant,
    appendAssistantWithChips,
    bookingPhoneConfirmed,
    bookingHandoffStep,
  ]);

  const handleQuickReply = useCallback(
    (chip: SuggestionChip) => {
      if (conciergeMode === "booking" && isBookingJourneyChip(chip)) {
        appendLocalUser(chip.message, chip.label);
        const result = applyBookingJourneyChip(chip, leadDraft);
        patchLeadDraft(result.leadDraftPatch);
        if (result.structuredPatch) {
          patchStructuredIntake(result.structuredPatch);
        }
        if (result.routeToDiagnostic) {
          sendWithMode("diagnostic", {
            id: "book-need-repair",
            label: "Repair",
            message: "I need help with a repair on my vehicle.",
          });
          return;
        }
        if (result.assistantMessage && result.nextChips?.length) {
          appendAssistantWithChips(result.assistantMessage, result.nextChips);
        } else if (result.assistantMessage) {
          appendLocalAssistant(result.assistantMessage);
        }
        return;
      }
      if (chip.id === CALLBACK_CONFIRM_CHIP_ID) {
        if (intakeSubmitState === "sending" || intakeSubmitState === "sent") {
          return;
        }
        void completeCallbackHandoff();
        return;
      }
      if (chip.id === BOOKING_USE_STORED_PHONE_CHIP_ID) {
        setBookingPhoneConfirmed(true);
        bookingAwaitingNewPhoneRef.current = false;
        bookingHandoffPromptRef.current = "none";
        return;
      }
      if (chip.id === BOOKING_USE_DIFFERENT_PHONE_CHIP_ID) {
        resetBookingHandoffFlow();
        bookingAwaitingNewPhoneRef.current = true;
        appendLocalAssistant("No problem — please type the UK mobile number you'd like the workshop to call.");
        return;
      }
      if (chip.id === BOOKING_CHANGE_DAY_CHIP_ID) {
        resetBookingReviewOnly();
        void send(chip.message, {
          displayContent: chip.label,
          source: "quick_reply",
          registration: vehicle.reg,
        });
        return;
      }
      if (chip.id === BOOKING_CHANGE_CONTACT_CHIP_ID) {
        setBookingPhoneConfirmed(false);
        resetBookingReviewOnly();
        bookingAwaitingNewPhoneRef.current = true;
        void send(chip.message, {
          displayContent: chip.label,
          source: "quick_reply",
          registration: vehicle.reg,
        });
        return;
      }
      if (chip.id === BOOKING_CHANGE_SERVICE_CHIP_ID) {
        resetBookingReviewOnly();
        void send(chip.message, {
          displayContent: chip.label,
          source: "quick_reply",
          registration: vehicle.reg,
        });
        return;
      }
      if (chip.id === BOOKING_CONFIRM_CHIP_ID) {
        if (intakeSubmitState === "sending" || intakeSubmitState === "sent") {
          return;
        }
        const traceId = createBookingTraceId();
        bookingTraceRef.current = traceId;
        bookingTraceStage("1_user_action", traceId, {
          action: "chip_tap",
          chipId: BOOKING_CONFIRM_CHIP_ID,
          chipLabel: chip.label,
        });
        void completeBookingHandoff();
        return;
      }
      if (chip.id === "escalate-callback") {
        sendWithMode("callback", chip);
        return;
      }
      if (chip.id === PRICING_ACTION_BOOK) {
        startContextualBookingHandoff(chip, "repair_booking");
        return;
      }
      if (chip.id === PRICING_ACTION_CALLBACK) {
        sendWithMode("callback", chip);
        return;
      }
      if (chip.id === DIAGNOSTIC_ACTION_ESTIMATE) {
        sendWithMode("pricing", chip);
        return;
      }
      if (chip.id === DIAGNOSTIC_ACTION_BOOK) {
        startContextualBookingHandoff(chip, "diagnostic_inspection");
        return;
      }
      if (chip.id === DIAGNOSTIC_ACTION_CALLBACK) {
        sendWithMode("callback", chip);
        return;
      }
      if (chip.id === DIAGNOSTIC_ACTION_RECOVERY) {
        void send(chip.message, {
          displayContent: chip.label,
          source: "quick_reply",
          registration: vehicle.reg,
        });
        return;
      }
      if (chip.id === PRICING_ACTION_QUESTION || chip.id === "escalate-continue") {
        void send(chip.message, {
          displayContent: chip.label,
          source: "quick_reply",
          registration: vehicle.reg,
        });
        return;
      }
      sendQuickReply(chip, vehicle.reg);
    },
    [
      conciergeMode,
      leadDraft,
      send,
      sendQuickReply,
      sendWithMode,
      vehicle.reg,
      completeCallbackHandoff,
      completeBookingHandoff,
      intakeSubmitState,
      appendLocalAssistant,
      appendLocalUser,
      appendAssistantWithChips,
      patchLeadDraft,
      patchStructuredIntake,
      resetBookingHandoffFlow,
      resetBookingReviewOnly,
      startContextualBookingHandoff,
    ]
  );

  const handleSend = useCallback(() => {
    const text = draft.trim();
    if (!text || isTyping || uploadsInProgress) return;
    setDraft("");

    if (conciergeMode === "hub") {
      const mode: HeroConciergeMode = "quick_question";
      setConciergeMode(mode);
      void send(text, {
        registration: vehicle.reg,
        advisorRouteOverride: buildRouteForMode(mode),
      });
      return;
    }

    if (
      (conciergeMode === "callback" || conciergeMode === "booking") &&
      isPlaceholderContactInput(text)
    ) {
      appendLocalAssistant(
        "Please send your real full name and UK mobile number — I can't use placeholder text like that."
      );
      return;
    }

    if (
      (conciergeMode === "callback" || conciergeMode === "booking") &&
      looksLikePhoneInput(text)
    ) {
      const parsed = parseUkPhone(text);
      if (!parsed.valid) {
        appendLocalAssistant(UK_PHONE_INVALID_HINT);
        return;
      }
      void send(`My contact number is ${parsed.national}.`, {
        displayContent: parsed.display,
        registration: vehicle.reg,
      });
      if (conciergeMode === "booking" && bookingAwaitingNewPhoneRef.current) {
        bookingAwaitingNewPhoneRef.current = false;
        setBookingPhoneConfirmed(true);
        bookingHandoffPromptRef.current = "none";
      }
      return;
    }

    if (conciergeMode === "booking" && isReviewReopenRequest(text)) {
      bookingReviewDismissedRef.current = false;
      bookingHandoffPromptRef.current = "none";
      appendLocalAssistant("Sure — review your booking request below when you're ready to send.");
      return;
    }

    if (conciergeMode === "diagnostic" || conciergeMode === "pricing") {
      const intake = structuredIntake ?? createEmptyStructuredIntake();
      const source: ContextualBookingSource =
        conciergeMode === "pricing" ? "repair_booking" : "diagnostic_inspection";
      const contextReady =
        conciergeMode === "pricing" || diagnosticSummaryReady(intake);

      if (contextReady) {
        if (advanceContextualBookingFromText(text, source)) {
          return;
        }

        const service = resolveContextualBookingService(intake, leadDraft, source);
        const mergedDraft = {
          ...leadDraft,
          problemDescription: leadDraft.problemDescription ?? service,
        };
        const progress = resolveBookingJourneyProgress(intake, mergedDraft);

        if (
          (isAffirmativeBookingConfirmation(text) ||
            /\b(prepare|send).*(?:request|booking)\b/i.test(text)) &&
          progress.windowSelected
        ) {
          setConciergeMode("booking");
          resetBookingHandoffFlow();
          patchLeadDraft({ problemDescription: mergedDraft.problemDescription });
          appendLocalUser(text);
          appendLocalAssistant(
            "Let's finish your booking request — review the details below, then tap Send booking request when you're ready."
          );
          return;
        }
      }
    }

    if (conciergeMode === "booking") {
      const intake = structuredIntake ?? createEmptyStructuredIntake();
      const validation = validateLeadCompletion("booking", intake, leadDraft, vehicle.reg);
      if (
        validation.canSubmit &&
        bookingPhoneConfirmed &&
        (bookingHandoffStep === "preview" || bookingHandoffStep === "change_details") &&
        isAffirmativeBookingConfirmation(text)
      ) {
        const traceId = createBookingTraceId();
        bookingTraceRef.current = traceId;
        bookingTraceStage("1_user_action", traceId, {
          action: "typed_affirmative",
          text,
          validation: traceValidationResult(validation),
        });
        void submitBookingHandoff({
          confirmationText: text,
          displayContent: text,
          traceId,
          userAction: "typed_affirmative",
        });
        return;
      }
    }

    if (conciergeMode === "callback") {
      const intake = structuredIntake ?? createEmptyStructuredIntake();
      const validation = validateLeadCompletion("callback", intake, leadDraft, vehicle.reg);
      if (validation.canSubmit && isAffirmativeCallbackConfirmation(text)) {
        void completeCallbackHandoff();
        return;
      }
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
    buildRouteForMode,
    structuredIntake,
    leadDraft,
    submitBookingHandoff,
    completeCallbackHandoff,
    bookingPhoneConfirmed,
    bookingHandoffStep,
    advanceContextualBookingFromText,
    resetBookingHandoffFlow,
  ]);

  const HANDOFF_CONFIRM_CHIP_IDS = [CALLBACK_CONFIRM_CHIP_ID, BOOKING_CONFIRM_CHIP_ID] as const;

  const transformHandoffChips = useCallback(
    (chips: SuggestionChip[]): SuggestionChip[] =>
      chips.map((chip) => {
        if (!HANDOFF_CONFIRM_CHIP_IDS.includes(chip.id as (typeof HANDOFF_CONFIRM_CHIP_IDS)[number])) {
          return chip;
        }
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

  const isHandoffChipDisabled = useCallback(
    (chip: SuggestionChip) =>
      HANDOFF_CONFIRM_CHIP_IDS.includes(chip.id as (typeof HANDOFF_CONFIRM_CHIP_IDS)[number]) &&
      (intakeSubmitState === "sending" || intakeSubmitState === "sent"),
    [intakeSubmitState]
  );

  const systemBanner = useMemo(
    () =>
      resolveSystemBanner({
        intakeSubmitState,
        conciergeMode,
        uploadsInProgress,
        isTyping,
        typingLabel,
        handoffMeta: handoffResult,
      }),
    [intakeSubmitState, conciergeMode, uploadsInProgress, isTyping, typingLabel, handoffResult]
  );

  useEffect(() => {
    if (conciergeMode !== "booking" || !bookingTraceRef.current) return;
    if (intakeSubmitState === "sent" || intakeSubmitState === "error") {
      bookingTraceStage("10_client_success_banner", bookingTraceRef.current, {
        intakeSubmitState,
        banner: systemBanner,
      });
    }
  }, [conciergeMode, intakeSubmitState, systemBanner]);

  const handleHandoffRetry = useCallback(() => {
    if (conciergeMode === "booking") {
      void completeBookingHandoff();
    } else if (conciergeMode === "callback") {
      void completeCallbackHandoff();
    }
  }, [conciergeMode, completeBookingHandoff, completeCallbackHandoff]);

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
        className="hero-floating-window--assistant-chat"
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
        <div className="hero-advisor-chat flex min-h-[280px] max-h-[min(52vh,420px)] sm:max-h-[min(58vh,480px)] w-full max-w-full flex-col overflow-hidden">
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
              (conciergeMode === "callback" || conciergeMode === "booking") &&
              intakeSubmitState === "error"
                ? null
                : error
            }
            theme="gold"
            quickRepliesDisabled={
              isTyping || uploadsInProgress || intakeSubmitState === "sending"
            }
            intro={intro}
            className="min-h-0 flex-1"
            transformChips={
              conciergeMode === "callback" || conciergeMode === "booking"
                ? transformHandoffChips
                : undefined
            }
            isChipDisabled={
              conciergeMode === "callback" || conciergeMode === "booking"
                ? isHandoffChipDisabled
                : undefined
            }
            onHandoffRetry={
              (conciergeMode === "callback" || conciergeMode === "booking") &&
              intakeSubmitState === "error"
                ? () =>
                    void (conciergeMode === "booking"
                      ? completeBookingHandoff()
                      : completeCallbackHandoff())
                : undefined
            }
          />

          <div className="hero-advisor-chat__composer shrink-0 border-t border-white/[0.06] px-3 pb-2.5 pt-2 sm:px-4">
            {bookingPreviewSummary ? (
              <BookingHandoffReview
                summary={bookingPreviewSummary}
                mode={bookingHandoffStep === "change_details" ? "change_details" : "review"}
                submitting={intakeSubmitState === "sending"}
                onSend={() => void completeBookingHandoff()}
                onChangeDetails={handleBookingChangeDetails}
                onNotNow={handleBookingNotNow}
                onChangeDay={handleBookingChangeDay}
                onChangeContact={handleBookingChangeContact}
                onChangeService={handleBookingChangeService}
                onChangeAppointment={handleBookingChangeAppointment}
                onBackToReview={handleBackToReview}
                className="mb-2.5"
              />
            ) : null}
            <SystemStatusBanner banner={systemBanner} onRetry={handleHandoffRetry} />
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
