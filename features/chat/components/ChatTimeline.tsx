"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import { ChatMessageBubble } from "@/features/chat/components/ChatMessageBubble";
import { ChatTypingIndicator } from "@/features/chat/components/ChatTypingIndicator";
import type { AdvisorChatTheme } from "@/features/chat/hooks/useAdvisorChat";
import type { ChatMessage } from "@/lib/types/chat";
import type { SuggestionChip } from "@/lib/types/intake";

type Props = {
  messages: ChatMessage[];
  isTyping: boolean;
  typingLabel?: string | null;
  onQuickReply?: (chip: SuggestionChip) => void;
  error?: string | null;
  theme?: AdvisorChatTheme;
  quickRepliesDisabled?: boolean;
  className?: string;
  /** Mode selection hub only — shown when there are no messages yet. */
  intro?: ReactNode;
  footer?: ReactNode;
};

export function ChatTimeline({
  messages,
  isTyping,
  typingLabel,
  onQuickReply,
  error,
  theme = "gold",
  quickRepliesDisabled,
  className = "",
  intro,
  footer,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  let lastAssistantIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]!.role === "assistant") {
      lastAssistantIdx = i;
      break;
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping, footer]);

  return (
    <div className={`flex min-h-0 flex-1 flex-col ${className}`}>
      <div
        ref={scrollRef}
        className="chat-timeline min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-3.5"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        <div className="flex flex-col gap-2.5">
          {messages.length === 0 && intro && <div className="pb-0.5">{intro}</div>}

          {messages.map((msg, i) => {
            const showChips =
              !isTyping &&
              msg.role === "assistant" &&
              i === lastAssistantIdx &&
              Boolean(msg.chipsSnapshot?.length);

            return (
              <ChatMessageBubble
                key={msg.id}
                message={msg}
                theme={theme}
                showInlineChips={showChips}
                inlineChipsDisabled={quickRepliesDisabled}
                onInlineChipSelect={onQuickReply}
              />
            );
          })}

          <AnimatePresence>
            {isTyping && <ChatTypingIndicator label={typingLabel} theme={theme} />}
          </AnimatePresence>

          <div ref={bottomRef} className="h-px shrink-0" aria-hidden />
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-950/40 px-3 py-2 text-center text-[11px] text-red-300/95">
            {error}
          </p>
        )}
      </div>

      {footer ? (
        <div className="shrink-0 border-t border-white/[0.06] px-3 py-2 sm:px-3.5">{footer}</div>
      ) : null}
    </div>
  );
}
