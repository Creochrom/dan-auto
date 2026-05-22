"use client";

import { useCallback, useRef, useState } from "react";
import { sendChatMessage, submitAiIntake } from "@/lib/api/client";
import {
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
import type {
  BookingChatContext,
  ChatMessage,
  SendChatOptions,
} from "@/lib/types/chat";
import type { MechanicIntakeSummary, SuggestionChip } from "@/lib/types/intake";

const TYPING_DELAY_MS = 500;

export type AdvisorChatTheme = "gold" | "cyan";

export type IntakeSubmitState = "idle" | "sending" | "sent" | "error";

export type UseAdvisorChatOptions = {
  bookingContext?: BookingChatContext | null;
  sessionStorageKey?: string;
  enabled?: boolean;
  uploadIds?: string[];
};

export function useAdvisorChat(options: UseAdvisorChatOptions = {}) {
  const {
    bookingContext = null,
    sessionStorageKey,
    enabled = true,
    uploadIds = [],
  } = options;

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

  const booted = useRef(false);
  const sending = useRef(false);
  const intakeSubmitStarted = useRef(false);
  const chipsRef = useRef<SuggestionChip[]>([]);
  const uploadIdsRef = useRef(uploadIds);
  uploadIdsRef.current = uploadIds;

  chipsRef.current = suggestionChips;

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
      if (res.mechanicSummary) setMechanicSummary(res.mechanicSummary);
      if (res.intakeComplete) setIntakeComplete(true);

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

  const appendAssistantNotice = useCallback(
    (content: string, sid: string) => {
      const notice: ChatMessage = {
        id: `notice-${Date.now()}`,
        role: "assistant",
        content,
        createdAt: new Date().toISOString(),
        source: "system",
      };
      setMessages((prev) => {
        const next = [...prev, notice];
        persist(sid, next);
        return next;
      });
    },
    [persist]
  );

  const trySubmitIntake = useCallback(
    async (res: Awaited<ReturnType<typeof sendChatMessage>>) => {
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
      if (res.mechanicSummary) setMechanicSummary(res.mechanicSummary);
      if (res.intakeComplete) setIntakeComplete(true);

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

      const chipsOffered = [...chipsRef.current];
      setError(null);
      setIsTyping(true);
      setTypingLabel(ADVISOR_TYPING_LABELS.symptoms);
      setSuggestionChips([]);
      sending.current = true;

      const optimistic = createOptimisticUserMessage(trimmed, {
        displayContent: sendOpts?.displayContent ?? trimmed,
        source: sendOpts?.source ?? "typed",
      });
      setMessages((m) => [...m, optimistic]);

      try {
        await new Promise((r) => setTimeout(r, TYPING_DELAY_MS));
        const res = await sendChatMessage({
          sessionId,
          message: trimmed,
          registration: sendOpts?.registration,
          bookingContext: bookingContext ?? undefined,
        });
        setTypingLabel(res.typingLabel ?? null);
        await revealResponse(res, optimistic, chipsOffered);
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
    [sessionId, bookingContext, enabled, revealResponse]
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

    booted.current = true;

    if (sessionId) {
      const restored = loadChatTranscript(sessionId);
      if (restored?.length) {
        setMessages(restored);
        booted.current = true;
        return;
      }
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
        bookingContext: bookingContext ?? undefined,
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
  }, [enabled, messages.length, sessionId, bookingContext, revealResponse]);

  const reset = useCallback(() => {
    if (sessionId) clearChatTranscript(sessionId);
    if (sessionStorageKey) sessionStorage.removeItem(sessionStorageKey);
    setMessages([]);
    setSessionId(undefined);
    setSuggestionChips([]);
    setMechanicSummary(undefined);
    setIntakeComplete(false);
    setIntakeSubmitState("idle");
    intakeSubmitStarted.current = false;
    booted.current = false;
  }, [sessionId, sessionStorageKey]);

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
    sessionId,
  };
}
