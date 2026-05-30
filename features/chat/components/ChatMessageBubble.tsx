"use client";

import { motion } from "framer-motion";
import { bubbleText, stripAdvisorSemanticLabels } from "@/lib/chat";
import { ChatQuickReplies } from "@/features/chat/components/ChatQuickReplies";
import { AdvisorHandoffNoticeBubble } from "@/features/chat/components/AdvisorHandoffNoticeBubble";
import type { ChatMessage } from "@/lib/types/chat";
import type { SuggestionChip } from "@/lib/types/intake";
import type { AdvisorChatTheme } from "@/features/chat/hooks/useAdvisorChat";

const USER_STYLES: Record<AdvisorChatTheme, string> = {
  gold: "bg-[#d4a63c]/14 text-[#f0e4c4] ring-1 ring-[#d4a63c]/22",
  cyan: "bg-cyan/12 text-cyan-50 ring-1 ring-cyan/22",
};

const ASSISTANT_BUBBLE =
  "chat-bubble w-full max-w-[min(92%,320px)] rounded-xl px-3 py-2 text-[13px] leading-[1.55] text-zinc-200 sm:max-w-[88%]";

function parseModeIntro(content: string): { title?: string; body: string } {
  const split = content.split(/\n\n/);
  if (split.length >= 2) {
    const title = split[0]!.trim();
    const body = split.slice(1).join("\n\n").trim();
    if (title.length > 0 && title.length < 56 && !title.includes(":")) {
      return { title, body };
    }
  }
  return { body: content };
}

type Props = {
  message: ChatMessage;
  theme?: AdvisorChatTheme;
  showInlineChips?: boolean;
  inlineChipsDisabled?: boolean;
  onInlineChipSelect?: (chip: SuggestionChip) => void;
  transformChips?: (chips: SuggestionChip[]) => SuggestionChip[];
  isChipDisabled?: (chip: SuggestionChip) => boolean;
  onHandoffRetry?: () => void;
};

export function ChatMessageBubble({
  message,
  theme = "gold",
  showInlineChips = false,
  inlineChipsDisabled,
  onInlineChipSelect,
  transformChips,
  isChipDisabled,
  onHandoffRetry,
}: Props) {
  const isUser = message.role === "user";
  const isSending = message.status === "sending";

  if (message.noticeVariant) {
    return (
      <AdvisorHandoffNoticeBubble
        message={message}
        onRetry={message.noticeVariant === "error" ? onHandoffRetry : undefined}
      />
    );
  }

  const chipsRaw = showInlineChips ? message.chipsSnapshot : undefined;
  const chips = chipsRaw?.length
    ? transformChips
      ? transformChips(chipsRaw)
      : chipsRaw
    : undefined;

  if (isUser) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: isSending ? 0.85 : 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="flex w-full justify-end"
      >
        <div
          className={`max-w-[min(92%,300px)] rounded-xl px-3 py-2 text-[13px] leading-[1.55] sm:max-w-[85%] ${USER_STYLES[theme]} ${isSending ? "chat-bubble--sending" : ""} ${message.status === "failed" ? "opacity-60" : ""}`}
        >
          <p>{bubbleText(message)}</p>
        </div>
      </motion.div>
    );
  }

  const modeIntro = parseModeIntro(message.content);

  if (modeIntro.title) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: isSending ? 0.85 : 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className="flex w-full flex-col items-start"
      >
        <div
          className={`${ASSISTANT_BUBBLE} bg-white/[0.04] ${isSending ? "chat-bubble--sending" : ""}`}
        >
          <p className="advisor-mode-intro__title">{modeIntro.title}</p>
          <p className="advisor-mode-intro__body whitespace-pre-wrap">{modeIntro.body}</p>
        </div>
        {chips && chips.length > 0 && (
          <div className="chat-inline-replies-anchor mt-1.5 w-full max-w-[min(92%,320px)] sm:max-w-[88%]">
            <ChatQuickReplies
              chips={chips}
              onSelect={onInlineChipSelect}
              disabled={inlineChipsDisabled}
              theme={theme}
              layout="inline"
              isChipDisabled={isChipDisabled}
            />
          </div>
        )}
      </motion.div>
    );
  }

  const displayContent = stripAdvisorSemanticLabels(message.content);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: isSending ? 0.85 : 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="flex w-full flex-col items-start"
    >
      <div
        className={`${ASSISTANT_BUBBLE} bg-white/[0.04] ${isSending ? "chat-bubble--sending" : ""}`}
      >
        <p className="whitespace-pre-wrap">{displayContent}</p>
      </div>

      {chips && chips.length > 0 && (
        <div className="chat-inline-replies-anchor mt-1.5 w-full max-w-[min(92%,320px)] sm:max-w-[88%]">
          <ChatQuickReplies
            chips={chips}
            onSelect={onInlineChipSelect}
            disabled={inlineChipsDisabled}
            theme={theme}
            layout="inline"
            isChipDisabled={isChipDisabled}
          />
        </div>
      )}
    </motion.div>
  );
}
