"use client";

import { useCallback, useRef, useState } from "react";
import { sendChatMessage, submitAiIntake, completeBookingIntake } from "@/lib/api/client";
import { validateLeadContact } from "@/lib/validation/advisor-contact";
import {
  clearAllChipsSnapshots,
  createOptimisticUserMessage,
  mergeTurnIntoTimeline,
  saveChatTranscript,
  loadChatTranscript,
  clearChatTranscript,
  REVEAL_FIRST_MS,
  REVEAL_BETWEEN_MS,
} from "@/lib/chat";
import {
  finalizeAssistantChunks,
  resolveCanonicalEngine,
  type FinalizeAssistantOptions,
} from "@/lib/chat/assistant-output";
import { ADVISOR_TYPING_LABELS } from "@/lib/config/brand";
import type { AdvisorRouteContext } from "@/lib/types/advisor-routing";
import type {
  BookingChatContext,
  ChatMessage,
  LeadDraft,
  SendChatOptions,
} from "@/lib/types/chat";
import type { MechanicIntakeSummary, SuggestionChip } from "@/lib/types/intake";
import type { StructuredIntake } from "@/lib/types/structured-intake";
import { createEmptyStructuredIntake } from "@/lib/types/structured-intake";
import {
  BOOKING_CONFIRM_CHIP,
  buildBookingIntakePayload,
  isBookingHandoffReady,
} from "@/lib/services/booking-handoff";
import { CALLBACK_CONFIRM_CHIP } from "@/lib/config/callback-flow-copy";
import { isCallbackHandoffReady } from "@/lib/services/callback-handoff";
import type { HandoffDeliveryMeta } from "@/lib/config/system-status-copy";
import {
  bookingTraceEnd,
  bookingTraceStage,
  bookingTraceStart,
  createBookingTraceId,
  tracePayloadSummary,
} from "@/lib/logging/booking-trace";

const TYPING_DELAY_MS = 500;

export type AdvisorChatTheme = "gold" | "cyan";

export type IntakeSubmitState = "idle" | "sending" | "sent" | "error";

export type AdvisorIntroMode = "workshop" | "gemini";

export type WorkshopHandoffInput = {
  name: string;
  phone: string;
  preferredCallbackTime?: string;
  customerEmail?: string;
  confirmationMessage?: string;
  /** When true, only updates status — assistant already confirmed in chat. */
  skipNotice?: boolean;
  /** Short in-chat success notice (shown only after API confirms). */
  successNotice?: string;
  /** Short in-chat error notice when submission fails. */
  errorNotice?: string;
};

export type UseAdvisorChatOptions = {
  bookingContext?: BookingChatContext | null;
  advisorRoute?: AdvisorRouteContext | null;
  registrationHint?: string;
  sessionStorageKey?: string;
  enabled?: boolean;
  uploadIds?: string[];
  /** `workshop` = static terminal intro; first user message starts the AI. */
  introMode?: AdvisorIntroMode;
  /** When false, workshop email only via submitWorkshopHandoff(). Hero concierge uses false. */
  autoSubmitIntake?: boolean;
};

export function useAdvisorChat(options: UseAdvisorChatOptions = {}) {
  const {
    bookingContext = null,
    advisorRoute = null,
    registrationHint,
    sessionStorageKey,
    enabled = true,
    uploadIds = [],
    introMode = "gemini",
    autoSubmitIntake = true,
  } = options;

  const autoSubmitRef = useRef(autoSubmitIntake);
  autoSubmitRef.current = autoSubmitIntake;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>(() => {
    if (typeof window === "undefined" || !sessionStorageKey) return undefined;
    return sessionStorage.getItem(sessionStorageKey) ?? undefined;
  });
  const [isTyping, setIsTyping] = useState(false);
  const [typingLabel, setTypingLabel] = useState<string | null>(null);
  const [suggestionChips, setSuggestionChips] = useState<SuggestionChip[]>([]);
  const [mechanicSummary, setMechanicSummary] = useState<MechanicIntakeSummary | undefined>();
  const [intakeComplete, setIntakeComplete] = useState(false);
  const [intakeSubmitState, setIntakeSubmitState] =
    useState<IntakeSubmitState>("idle");
  const [handoffResult, setHandoffResult] = useState<HandoffDeliveryMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [leadDraft, setLeadDraft] = useState<LeadDraft>({});
  const [structuredIntake, setStructuredIntake] = useState<StructuredIntake | undefined>();
  const [callbackReady, setCallbackReady] = useState(false);

  const leadDraftRef = useRef(leadDraft);
  leadDraftRef.current = leadDraft;
  const structuredIntakeRef = useRef(structuredIntake);
  structuredIntakeRef.current = structuredIntake;

  const booted = useRef(false);
  const sending = useRef(false);
  const intakeSubmitStarted = useRef(false);
  const uploadIdsRef = useRef(uploadIds);
  uploadIdsRef.current = uploadIds;

  const persist = useCallback(
    (sid: string, msgs: ChatMessage[]) => {
      if (sessionStorageKey) {
        sessionStorage.setItem(sessionStorageKey, sid);
      }
      saveChatTranscript(sid, msgs);
    },
    [sessionStorageKey]
  );

  const buildFinalizeOpts = useCallback(
    (res: Awaited<ReturnType<typeof sendChatMessage>>): FinalizeAssistantOptions => ({
      canonicalEngine: resolveCanonicalEngine({
        routeEngine: advisorRoute?.vehicle_data?.engine,
        intakeEngine: res.structuredIntake?.vehicle?.engine,
      }),
      pricingMode: advisorRoute?.concierge_mode === "pricing",
    }),
    [advisorRoute]
  );

  const applyResponse = useCallback(
    (
      res: Awaited<ReturnType<typeof sendChatMessage>>,
      optimistic?: ChatMessage,
      chipsOffered?: SuggestionChip[]
    ) => {
      setSessionId(res.sessionId);
      setSuggestionChips(res.suggestionChips ?? []);
      if (res.leadDraft) setLeadDraft(res.leadDraft);
      if (res.structuredIntake) setStructuredIntake(res.structuredIntake);
      if (res.mechanicSummary) setMechanicSummary(res.mechanicSummary);
      if (res.intakeComplete) setIntakeComplete(true);
      setCallbackReady(Boolean(res.callbackReady));

      setMessages((prev) => {
        const merged = mergeTurnIntoTimeline(prev, {
          optimisticId: optimistic?.id,
          optimisticUser: optimistic,
          serverUser: res.userMessage,
          assistant: res.message,
          chipsOffered,
        });
        persist(res.sessionId, merged);
        return merged;
      });
    },
    [persist]
  );

  const appendNotice = useCallback(
    (content: string, variant: NonNullable<ChatMessage["noticeVariant"]>, sid?: string) => {
      const notice: ChatMessage = {
        id: `notice-${Date.now()}-${variant}`,
        role: "assistant",
        content,
        createdAt: new Date().toISOString(),
        source: "system",
        noticeVariant: variant,
      };
      setMessages((prev) => {
        const next = [...prev, notice];
        const id = sid ?? sessionId;
        if (id) persist(id, next);
        return next;
      });
    },
    [persist, sessionId]
  );

  const appendAssistantNotice = useCallback(
    (content: string, sid?: string) => {
      const notice: ChatMessage = {
        id: `notice-${Date.now()}`,
        role: "assistant",
        content,
        createdAt: new Date().toISOString(),
        source: "system",
      };
      setMessages((prev) => {
        const next = [...prev, notice];
        const id = sid ?? sessionId;
        if (id) persist(id, next);
        return next;
      });
    },
    [persist, sessionId]
  );

  const appendLocalAssistant = useCallback(
    (content: string) => {
      const notice: ChatMessage = {
        id: `local-a-${Date.now()}`,
        role: "assistant",
        content,
        createdAt: new Date().toISOString(),
        source: "system",
      };
      setMessages((prev) => {
        const next = [...clearAllChipsSnapshots(prev), notice];
        if (sessionId) persist(sessionId, next);
        return next;
      });
      setSuggestionChips([]);
    },
    [persist, sessionId]
  );

  const appendAssistantWithChips = useCallback(
    (content: string, chips: SuggestionChip[]) => {
      const notice: ChatMessage = {
        id: `local-a-${Date.now()}`,
        role: "assistant",
        content,
        createdAt: new Date().toISOString(),
        source: "system",
        chipsSnapshot: chips,
      };
      setMessages((prev) => {
        const next = [...clearAllChipsSnapshots(prev), notice];
        if (sessionId) persist(sessionId, next);
        return next;
      });
      setSuggestionChips(chips);
    },
    [persist, sessionId]
  );

  const appendLocalUser = useCallback(
    (content: string, displayContent?: string) => {
      const message: ChatMessage = {
        id: `local-u-${Date.now()}`,
        role: "user",
        content,
        displayContent: displayContent ?? content,
        createdAt: new Date().toISOString(),
        source: "quick_reply",
      };
      setMessages((prev) => {
        const next = [...prev, message];
        if (sessionId) persist(sessionId, next);
        return next;
      });
    },
    [persist, sessionId]
  );

  const patchLeadDraft = useCallback((patch: Partial<LeadDraft>) => {
    setLeadDraft((prev) => ({ ...prev, ...patch }));
  }, []);

  const patchStructuredIntake = useCallback((patch: Partial<StructuredIntake>) => {
    setStructuredIntake((prev) => {
      const base = prev ?? createEmptyStructuredIntake();
      return {
        ...base,
        ...patch,
        customer: { ...base.customer, ...(patch.customer ?? {}) },
        vehicle: { ...base.vehicle, ...(patch.vehicle ?? {}) },
        issue: { ...base.issue, ...(patch.issue ?? {}) },
        aiEstimate: { ...base.aiEstimate, ...(patch.aiEstimate ?? {}) },
      };
    });
  }, []);

  const trySubmitIntake = useCallback(
    async (res: Awaited<ReturnType<typeof sendChatMessage>>) => {
      if (!autoSubmitRef.current) return;
      if (bookingContext) return;
      if (res.intakeEmailed) {
        setIntakeSubmitState("sent");
        return;
      }
      if (!res.intakeComplete) {
        return;
      }
      const contact = validateLeadContact(res.leadDraft?.name, res.leadDraft?.phone);
      if (!contact.canSubmit) {
        return;
      }
      if (intakeSubmitStarted.current) return;
      intakeSubmitStarted.current = true;
      setIntakeSubmitState("sending");
      setIsTyping(true);
      setTypingLabel("Sending to the workshop team…");
      setSuggestionChips([]);

      try {
        const result = await submitAiIntake({
          chatSessionId: res.sessionId,
          uploadIds:
            uploadIdsRef.current.length > 0 ? uploadIdsRef.current : undefined,
        });
        setIntakeSubmitState("sent");
        appendAssistantNotice(result.confirmationMessage, res.sessionId);
      } catch (e) {
        intakeSubmitStarted.current = false;
        setIntakeSubmitState("error");
        setError(e instanceof Error ? e.message : "Could not send intake to workshop");
      } finally {
        setIsTyping(false);
        setTypingLabel(null);
      }
    },
    [bookingContext, appendAssistantNotice]
  );

  const retryIntakeSubmit = useCallback(async () => {
    if (!sessionId || bookingContext) return;
    intakeSubmitStarted.current = false;
    setError(null);
    setIntakeSubmitState("sending");
    setIsTyping(true);
    setTypingLabel("Sending to the workshop team…");
    try {
      const result = await submitAiIntake({
        chatSessionId: sessionId,
        uploadIds:
          uploadIdsRef.current.length > 0 ? uploadIdsRef.current : undefined,
      });
      setIntakeSubmitState("sent");
      appendAssistantNotice(result.confirmationMessage, sessionId);
    } catch (e) {
      setIntakeSubmitState("error");
      setError(e instanceof Error ? e.message : "Could not send intake to workshop");
    } finally {
      setIsTyping(false);
      setTypingLabel(null);
    }
  }, [sessionId, bookingContext, appendAssistantNotice]);

  const revealResponse = useCallback(
    async (
      res: Awaited<ReturnType<typeof sendChatMessage>>,
      optimistic?: ChatMessage,
      chipsOffered?: SuggestionChip[]
    ) => {
      const finalizeOpts = buildFinalizeOpts(res);
      const chunks = finalizeAssistantChunks(res.message.content, finalizeOpts);
      if (chunks.length <= 1) {
        applyResponse(res, optimistic, chipsOffered);
        await trySubmitIntake(res);
        return;
      }

      setSessionId(res.sessionId);
      if (res.leadDraft) setLeadDraft(res.leadDraft);
      if (res.structuredIntake) setStructuredIntake(res.structuredIntake);
      if (res.mechanicSummary) setMechanicSummary(res.mechanicSummary);
      if (res.intakeComplete) setIntakeComplete(true);
      setCallbackReady(Boolean(res.callbackReady));

      const label = res.typingLabel ?? ADVISOR_TYPING_LABELS.symptoms;
      await new Promise((r) => setTimeout(r, REVEAL_FIRST_MS));

      for (let i = 0; i < chunks.length; i++) {
        const isLast = i === chunks.length - 1;
        setIsTyping(true);
        setTypingLabel(isLast ? label : ADVISOR_TYPING_LABELS.causes);

        if (i > 0) {
          await new Promise((r) => setTimeout(r, REVEAL_BETWEEN_MS));
        }

        const assistant: ChatMessage = {
          ...res.message,
          id: i === 0 ? res.message.id : `${res.message.id}-p${i}`,
          content: chunks[i]!,
        };

        setMessages((prev) => {
          const merged = mergeTurnIntoTimeline(prev, {
            optimisticId: i === 0 ? optimistic?.id : undefined,
            optimisticUser: i === 0 ? optimistic : undefined,
            serverUser: i === 0 ? res.userMessage : undefined,
            assistant,
            chipsOffered: isLast ? chipsOffered : undefined,
          });
          persist(res.sessionId, merged);
          return merged;
        });

        if (isLast) {
          setSuggestionChips(res.suggestionChips ?? []);
        }
      }

      await trySubmitIntake(res);
    },
    [applyResponse, persist, trySubmitIntake, buildFinalizeOpts]
  );

  const send = useCallback(
    async (content: string, sendOpts?: SendChatOptions) => {
      const trimmed = content.trim();
      if (!trimmed || sending.current || !enabled) return;

      setError(null);
      setIsTyping(true);
      setTypingLabel(ADVISOR_TYPING_LABELS.symptoms);
      setSuggestionChips([]);
      sending.current = true;

      const optimistic = createOptimisticUserMessage(trimmed, {
        displayContent: sendOpts?.displayContent ?? trimmed,
        source: sendOpts?.source ?? "typed",
      });
      setMessages((m) => [...clearAllChipsSnapshots(m), optimistic]);

      try {
        await new Promise((r) => setTimeout(r, TYPING_DELAY_MS));
        const res = await sendChatMessage({
          sessionId,
          message: trimmed,
          registration: sendOpts?.registration ?? registrationHint,
          bookingContext: bookingContext ?? undefined,
          advisorRoute: sendOpts?.advisorRouteOverride ?? advisorRoute ?? undefined,
        });
        setTypingLabel(res.typingLabel ?? null);
        await revealResponse(res, optimistic, res.suggestionChips);
      } catch (e) {
        const bookingReady = isBookingHandoffReady(
          advisorRoute?.concierge_mode,
          structuredIntakeRef.current,
          leadDraftRef.current,
          sendOpts?.registration ?? registrationHint
        );
        const callbackReady = isCallbackHandoffReady(
          advisorRoute?.concierge_mode,
          structuredIntakeRef.current,
          leadDraftRef.current,
          sendOpts?.registration ?? registrationHint
        );
        if (bookingReady) {
          setError(null);
          setSuggestionChips([BOOKING_CONFIRM_CHIP]);
        } else if (callbackReady) {
          setError(null);
          setSuggestionChips([CALLBACK_CONFIRM_CHIP]);
        } else {
          setError(e instanceof Error ? e.message : "Message failed");
        }
        setMessages((m) =>
          m.map((msg) =>
            msg.id === optimistic.id ? { ...msg, status: "failed" } : msg
          )
        );
      } finally {
        setIsTyping(false);
        setTypingLabel(null);
        sending.current = false;
      }
    },
    [sessionId, bookingContext, advisorRoute, registrationHint, enabled, revealResponse]
  );

  const sendQuickReply = useCallback(
    (chip: SuggestionChip, registration?: string) => {
      void send(chip.message, {
        displayContent: chip.label,
        source: "quick_reply",
        registration,
      });
    },
    [send]
  );

  const bootstrap = useCallback(async () => {
    if (!enabled || booted.current || sending.current) return;
    if (messages.length > 0) return;

    if (sessionId) {
      const restored = loadChatTranscript(sessionId);
      if (restored?.length) {
        setMessages(restored);
        booted.current = true;
        return;
      }
    }

    booted.current = true;

    if (introMode === "workshop") {
      return;
    }

    setError(null);
    setIsTyping(true);
    setTypingLabel(ADVISOR_TYPING_LABELS.init);
    sending.current = true;

    try {
      await new Promise((r) => setTimeout(r, TYPING_DELAY_MS));
      const res = await sendChatMessage({
        sessionId,
        init: true,
        registration: registrationHint,
        bookingContext: bookingContext ?? undefined,
        advisorRoute: advisorRoute ?? undefined,
      });
      await revealResponse(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start advisor");
      booted.current = false;
    } finally {
      setIsTyping(false);
      setTypingLabel(null);
      sending.current = false;
    }
  }, [
    enabled,
    messages.length,
    sessionId,
    bookingContext,
    advisorRoute,
    registrationHint,
    introMode,
    revealResponse,
  ]);

  const submitWorkshopHandoff = useCallback(
    async (input: WorkshopHandoffInput) => {
      if (!sessionId) {
        setError("Start a conversation before sending to the workshop");
        return false;
      }
      if (intakeSubmitState === "sending") {
        return false;
      }
      if (intakeSubmitStarted.current && intakeSubmitState === "sent") {
        return true;
      }

      intakeSubmitStarted.current = true;
      setIntakeSubmitState("sending");
      setError(null);
      setIsTyping(true);
      setTypingLabel("Sending to the workshop team…");
      setSuggestionChips([]);
      setMessages((prev) => clearAllChipsSnapshots(prev));

      try {
        const result = await submitAiIntake({
          chatSessionId: sessionId,
          uploadIds:
            uploadIdsRef.current.length > 0 ? uploadIdsRef.current : undefined,
          customerName: input.name,
          customerPhone: input.phone,
          preferredCallbackTime: input.preferredCallbackTime,
          customerEmail: input.customerEmail,
          snapshot: {
            messages,
            leadDraft,
            mechanicSummary,
            structuredIntake: structuredIntakeRef.current ?? undefined,
            advisorRoute: advisorRoute ?? undefined,
            bookingContext: bookingContext ?? undefined,
          },
        });
        setHandoffResult({
          leadId: result.leadId,
          submittedAt: result.submittedAt,
          emailSent: result.emailSent,
        });
        setIntakeSubmitState("sent");
        setIntakeComplete(true);
        setCallbackReady(false);
        return true;
      } catch (e) {
        intakeSubmitStarted.current = false;
        setIntakeSubmitState("error");
        setHandoffResult(null);
        setError(e instanceof Error ? e.message : "Could not send request to workshop");
        if (advisorRoute?.concierge_mode === "callback") {
          setSuggestionChips([CALLBACK_CONFIRM_CHIP]);
        }
        return false;
      } finally {
        setIsTyping(false);
        setTypingLabel(null);
      }
    },
    [
      sessionId,
      messages,
      leadDraft,
      mechanicSummary,
      advisorRoute,
      bookingContext,
      intakeSubmitState,
    ]
  );

  const submitBookingHandoff = useCallback(
    async (input?: {
      confirmationText?: string;
      displayContent?: string;
      name?: string;
      phone?: string;
      traceId?: string;
      userAction?: string;
    }) => {
      const traceId = input?.traceId ?? createBookingTraceId();
      bookingTraceStart(traceId, {
        userAction: input?.userAction ?? "submitBookingHandoff",
        chatSessionId: sessionId ?? null,
        conciergeMode: advisorRoute?.concierge_mode ?? null,
      });

      if (!sessionId) {
        bookingTraceEnd(traceId, "blocked", { reason: "no_session_id" });
        setError("Start a conversation before sending to the workshop");
        return false;
      }
      if (intakeSubmitState === "sending") {
        bookingTraceEnd(traceId, "blocked", { reason: "already_sending" });
        return false;
      }
      if (intakeSubmitStarted.current && intakeSubmitState === "sent") {
        bookingTraceEnd(traceId, "success", { reason: "already_sent" });
        return true;
      }

      bookingTraceStage("3_submitBookingHandoff", traceId, {
        intakeSubmitState,
        confirmationText: input?.confirmationText ?? null,
      });

      const payload = buildBookingIntakePayload({
        chatSessionId: sessionId,
        intake: structuredIntakeRef.current ?? createEmptyStructuredIntake(),
        leadDraft: leadDraftRef.current,
        registrationHint,
        uploadIds: uploadIdsRef.current,
        customerName: input?.name,
        customerPhone: input?.phone,
        traceId,
      });
      if (!payload) {
        bookingTraceEnd(traceId, "blocked", { reason: "payload_null" });
        setError("Booking details are incomplete");
        return false;
      }

      intakeSubmitStarted.current = true;
      setIntakeSubmitState("sending");
      setError(null);
      setIsTyping(true);
      setTypingLabel("Sending booking request…");

      if (input?.confirmationText?.trim()) {
        const optimistic = createOptimisticUserMessage(input.confirmationText.trim(), {
          displayContent: input.displayContent ?? input.confirmationText.trim(),
          source: "typed",
        });
        setMessages((prev) => [...prev, optimistic]);
      }

      try {
        bookingTraceStage("4_post_booking_intake", traceId, {
          payload: tracePayloadSummary(payload),
        });
        const result = await completeBookingIntake(payload);
        if (!result.bookingId) {
          throw new Error("Booking was not saved — no booking reference returned.");
        }
        bookingTraceStage("9_api_response", traceId, {
          bookingId: result.bookingId,
          emailSent: result.notificationSent,
          emailId: result.emailId ?? null,
          bookingCreated: result.bookingCreated,
          notificationSent: result.notificationSent,
        });
        setHandoffResult({
          bookingId: result.bookingId,
          submittedAt: new Date().toISOString(),
          emailSent: result.notificationSent,
          notificationSent: result.notificationSent,
          bookingCreated: result.bookingCreated,
        });
        setIntakeSubmitState("sent");
        setIntakeComplete(true);
        setCallbackReady(false);
        setSuggestionChips([]);
        setMessages((prev) => clearAllChipsSnapshots(prev));
        bookingTraceEnd(traceId, "success", {
          bookingId: result.bookingId,
          emailSent: result.emailSent,
          clientState: "sent",
        });
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Booking submission failed";
        bookingTraceEnd(traceId, "failure", {
          error: message,
          clientState: "error",
        });
        intakeSubmitStarted.current = false;
        setIntakeSubmitState("error");
        setSuggestionChips([BOOKING_CONFIRM_CHIP]);
        return false;
      } finally {
        setIsTyping(false);
        setTypingLabel(null);
      }
    },
    [sessionId, registrationHint, intakeSubmitState, advisorRoute?.concierge_mode]
  );

  const reset = useCallback(() => {
    if (sessionId) clearChatTranscript(sessionId);
    if (sessionStorageKey) sessionStorage.removeItem(sessionStorageKey);
    setMessages([]);
    setSessionId(undefined);
    setSuggestionChips([]);
    setMechanicSummary(undefined);
    setIntakeComplete(false);
    setIntakeSubmitState("idle");
    setHandoffResult(null);
    setLeadDraft({});
    setStructuredIntake(undefined);
    setCallbackReady(false);
    setError(null);
    intakeSubmitStarted.current = false;
    booted.current = false;
    sending.current = false;
    setIsTyping(false);
    setTypingLabel(null);
  }, [sessionStorageKey, sessionId]);

  return {
    messages,
    isTyping,
    typingLabel,
    suggestionChips,
    mechanicSummary,
    intakeComplete,
    intakeSubmitState,
    error,
    send,
    sendQuickReply,
    bootstrap,
    reset,
    retryIntakeSubmit,
    submitWorkshopHandoff,
    submitCallbackHandoff: submitWorkshopHandoff,
    submitBookingHandoff,
    handoffResult,
    sessionId,
    leadDraft,
    structuredIntake,
    callbackReady,
    appendLocalAssistant,
    appendAssistantWithChips,
    appendLocalUser,
    patchLeadDraft,
    patchStructuredIntake,
  };
}
