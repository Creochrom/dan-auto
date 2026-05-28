"use client";

import { useCallback, useRef, useState } from "react";
import { sendChatMessage, submitAiIntake } from "@/lib/api/client";
import {
  clearAllChipsSnapshots,
  createOptimisticUserMessage,
  mergeTurnIntoTimeline,
  saveChatTranscript,
  loadChatTranscript,
  clearChatTranscript,
  splitAssistantContent,
  REVEAL_FIRST_MS,
  REVEAL_BETWEEN_MS,
} from "@/lib/chat";
import { ADVISOR_TYPING_LABELS } from "@/lib/config/brand";
import type { AdvisorRouteContext } from "@/lib/types/advisor-routing";
import type {
  BookingChatContext,
  ChatMessage,
  LeadDraft,
  SendChatOptions,
} from "@/lib/types/chat";
import type { MechanicIntakeSummary, SuggestionChip } from "@/lib/types/intake";

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
  const [error, setError] = useState<string | null>(null);
  const [leadDraft, setLeadDraft] = useState<LeadDraft>({});
  const [callbackReady, setCallbackReady] = useState(false);

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

  const applyResponse = useCallback(
    (
      res: Awaited<ReturnType<typeof sendChatMessage>>,
      optimistic?: ChatMessage,
      chipsOffered?: SuggestionChip[]
    ) => {
      setSessionId(res.sessionId);
      setSuggestionChips(res.suggestionChips ?? []);
      if (res.leadDraft) setLeadDraft(res.leadDraft);
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
      setSuggestionChips([]);
    },
    [persist, sessionId]
  );

  const trySubmitIntake = useCallback(
    async (res: Awaited<ReturnType<typeof sendChatMessage>>) => {
      if (!autoSubmitRef.current) return;
      if (bookingContext) return;
      if (res.intakeEmailed) {
        setIntakeSubmitState("sent");
        return;
      }
      if (!res.intakeComplete || !res.leadDraft?.name?.trim() || !res.leadDraft?.phone?.trim()) {
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
      const chunks = splitAssistantContent(res.message.content);
      if (chunks.length <= 1) {
        applyResponse(res, optimistic, chipsOffered);
        await trySubmitIntake(res);
        return;
      }

      setSessionId(res.sessionId);
      if (res.leadDraft) setLeadDraft(res.leadDraft);
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
    [applyResponse, persist, trySubmitIntake]
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
          advisorRoute: advisorRoute ?? undefined,
        });
        setTypingLabel(res.typingLabel ?? null);
        await revealResponse(res, optimistic, res.suggestionChips);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Message failed");
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
            advisorRoute: advisorRoute ?? undefined,
            bookingContext: bookingContext ?? undefined,
          },
        });
        setIntakeSubmitState("sent");
        setIntakeComplete(true);
        setCallbackReady(false);
        if (input.successNotice) {
          appendNotice(input.successNotice, "success", sessionId);
        } else if (!input.skipNotice) {
          appendAssistantNotice(
            input.confirmationMessage ?? result.confirmationMessage,
            sessionId
          );
        }
        return true;
      } catch (e) {
        intakeSubmitStarted.current = false;
        setIntakeSubmitState("error");
        const message =
          e instanceof Error ? e.message : "Could not send intake to workshop";
        if (input.errorNotice) {
          appendNotice(input.errorNotice, "error", sessionId);
          setError(null);
        } else {
          setError(message);
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
      appendAssistantNotice,
      appendNotice,
    ]
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
    setLeadDraft({});
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
    sessionId,
    leadDraft,
    callbackReady,
    appendLocalAssistant,
    appendAssistantWithChips,
  };
}
