"use client";

import { motion } from "framer-motion";
import { bubbleText } from "@/lib/chat";
import type { ChatMessage } from "@/lib/types/chat";
import type { AdvisorChatTheme } from "@/features/chat/hooks/useAdvisorChat";

function formatAssistantContent(content: string) {
  return content.split("\n").map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={i} className="block">
        {parts.map((part, j) =>
          part.startsWith("**") && part.endsWith("**") ? (
            <strong key={j} className="font-semibold text-[#f0d9a8]">
              {part.slice(2, -2)}
            </strong>
          ) : part.startsWith("• ") ? (
            <span key={j} className="ml-1 text-zinc-300">
              {part}
            </span>
          ) : (
            <span key={j}>{part}</span>
          )
        )}
      </span>
    );
  });
}

const USER_STYLES: Record<AdvisorChatTheme, string> = {
  gold: "bg-[#d4a63c]/16 text-[#f5e6b8] ring-1 ring-[#d4a63c]/28 shadow-[0_4px_20px_rgba(212,166,60,0.12)]",
  cyan: "bg-cyan/14 text-cyan-50 ring-1 ring-cyan/28 shadow-[0_4px_20px_rgba(34,211,238,0.08)]",
};

const ASSISTANT_STYLES: Record<AdvisorChatTheme, string> = {
  gold: "border border-white/[0.08] bg-black/55 text-zinc-200 shadow-inner",
  cyan: "border border-white/[0.07] bg-black/50 text-zinc-200",
};

type Props = {
  message: ChatMessage;
  theme?: AdvisorChatTheme;
};

export function ChatMessageBubble({ message, theme = "gold" }: Props) {
  const isUser = message.role === "user";
  const isSending = message.status === "sending";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: isSending ? 0.85 : 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`chat-bubble max-w-[min(92%,320px)] rounded-2xl px-3.5 py-2.5 text-[13px] leading-[1.55] sm:max-w-[85%] ${
          isUser ? USER_STYLES[theme] : ASSISTANT_STYLES[theme]
        } ${isSending ? "chat-bubble--sending" : ""} ${message.status === "failed" ? "opacity-60 ring-1 ring-red-500/40" : ""}`}
      >
        {isUser ? (
          <>
            <p>{bubbleText(message)}</p>
            {message.source === "quick_reply" && (
              <p className="mt-1 text-[9px] font-medium uppercase tracking-wider opacity-60">
                Quick reply
              </p>
            )}
          </>
        ) : (
          formatAssistantContent(message.content)
        )}
      </div>
    </motion.div>
  );
}
