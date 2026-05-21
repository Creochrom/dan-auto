"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { ChatMessageBubble } from "@/features/chat/components/ChatMessageBubble";
import { ChatQuickReplies } from "@/features/chat/components/ChatQuickReplies";
import { ChatTypingIndicator } from "@/features/chat/components/ChatTypingIndicator";
import type { AdvisorChatTheme } from "@/features/chat/hooks/useAdvisorChat";
import type { ChatMessage } from "@/lib/types/chat";
import type { SuggestionChip } from "@/lib/types/intake";

type Props = {
  messages: ChatMessage[];
  isTyping: boolean;
  typingLabel?: string | null;
  suggestionChips: SuggestionChip[];
  onQuickReply?: (chip: SuggestionChip) => void;
  error?: string | null;
  theme?: AdvisorChatTheme;
  quickRepliesDisabled?: boolean;
  className?: string;
};

export function ChatTimeline({
  messages,
  isTyping,
  typingLabel,
  suggestionChips,
  onQuickReply,
  error,
  theme = "gold",
  quickRepliesDisabled,
  className = "",
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping, suggestionChips]);

  return (
    <div className={`flex min-h-0 flex-1 flex-col ${className}`}>
      <div
        ref={scrollRef}
        className="chat-timeline min-h-0 flex-1 overflow-y-auto px-3.5 py-4 sm:px-4"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        <div className="flex flex-col gap-3 sm:gap-3.5">
          {messages.map((msg) => (
            <div key={msg.id} className="flex flex-col gap-2">
              <ChatMessageBubble message={msg} theme={theme} />
              {msg.role === "assistant" && msg.chipsSnapshot && msg.chipsSnapshot.length > 0 && (
                <div className="pl-1">
                  <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-zinc-600">
                    Suggested
                  </p>
                  <ChatQuickReplies
                    chips={msg.chipsSnapshot}
                    theme={theme}
                    variant="history"
                  />
                </div>
              )}
            </div>
          ))}

          <AnimatePresence>
            {isTyping && (
              <ChatTypingIndicator label={typingLabel} theme={theme} />
            )}
          </AnimatePresence>

          <div ref={bottomRef} className="h-px shrink-0" aria-hidden />
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-950/40 px-3 py-2 text-center text-[11px] text-red-300/95">
            {error}
          </p>
        )}
      </div>

      {!isTyping && suggestionChips.length > 0 && (
        <div className="chat-quick-replies border-t border-white/[0.05] px-3.5 py-2.5 sm:px-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
            Quick replies
          </p>
          <ChatQuickReplies
            chips={suggestionChips}
            onSelect={onQuickReply}
            disabled={quickRepliesDisabled}
            theme={theme}
          />
        </div>
      )}
    </div>
  );
}
