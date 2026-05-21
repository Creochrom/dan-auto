"use client";

import { useCallback, useRef, useState } from "react";
import { sendChatMessage } from "@/lib/api/client";
import {
  createOptimisticUserMessage,
  mergeTurnIntoTimeline,
  saveChatTranscript,
  loadChatTranscript,
  clearChatTranscript,
} from "@/lib/chat";
import type {
  BookingChatContext,
  ChatMessage,
  SendChatOptions,
} from "@/lib/types/chat";
import type { MechanicIntakeSummary, SuggestionChip } from "@/lib/types/intake";

const TYPING_DELAY_MS = 500;

export type AdvisorChatTheme = "gold" | "cyan";

export type UseAdvisorChatOptions = {
  bookingContext?: BookingChatContext | null;
  sessionStorageKey?: string;
  enabled?: boolean;
};

export function useAdvisorChat(options: UseAdvisorChatOptions = {}) {
  const { bookingContext = null, sessionStorageKey, enabled = true } = options;

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
  const [error, setError] = useState<string | null>(null);

  const booted = useRef(false);
  const sending = useRef(false);
  const chipsRef = useRef<SuggestionChip[]>([]);

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

  const send = useCallback(
    async (content: string, sendOpts?: SendChatOptions) => {
      const trimmed = content.trim();
      if (!trimmed || sending.current || !enabled) return;

      const chipsOffered = [...chipsRef.current];
      setError(null);
      setIsTyping(true);
      setTypingLabel("Reviewing your notes…");
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
        applyResponse(res, optimistic, chipsOffered);
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
    [sessionId, bookingContext, enabled, applyResponse]
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
    setTypingLabel("Preparing your intake…");
    sending.current = true;

    try {
      await new Promise((r) => setTimeout(r, TYPING_DELAY_MS));
      const res = await sendChatMessage({
        sessionId,
        init: true,
        bookingContext: bookingContext ?? undefined,
      });
      applyResponse(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start advisor");
      booted.current = false;
    } finally {
      setIsTyping(false);
      setTypingLabel(null);
      sending.current = false;
    }
  }, [enabled, messages.length, sessionId, bookingContext, applyResponse]);

  const reset = useCallback(() => {
    if (sessionId) clearChatTranscript(sessionId);
    if (sessionStorageKey) sessionStorage.removeItem(sessionStorageKey);
    setMessages([]);
    setSessionId(undefined);
    setSuggestionChips([]);
    setMechanicSummary(undefined);
    setIntakeComplete(false);
    booted.current = false;
  }, [sessionId, sessionStorageKey]);

  return {
    messages,
    isTyping,
    typingLabel,
    suggestionChips,
    mechanicSummary,
    intakeComplete,
    error,
    send,
    sendQuickReply,
    bootstrap,
    reset,
    sessionId,
  };
}
