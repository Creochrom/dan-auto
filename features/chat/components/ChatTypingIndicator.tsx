"use client";

import { motion } from "framer-motion";
import type { AdvisorChatTheme } from "@/features/chat/hooks/useAdvisorChat";

const DOT: Record<AdvisorChatTheme, string> = {
  gold: "bg-[#d4a63c]/90",
  cyan: "bg-cyan/80",
};

type Props = {
  label?: string | null;
  theme?: AdvisorChatTheme;
};

export function ChatTypingIndicator({ label, theme = "gold" }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      className="flex justify-start"
    >
      <div className="rounded-2xl border border-white/[0.07] bg-black/50 px-3.5 py-2.5">
        {label && (
          <p className="mb-1.5 text-[10px] font-medium tracking-wide text-zinc-500">
            {label}
          </p>
        )}
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${DOT[theme]}`}
              animate={{ opacity: [0.25, 1, 0.25], y: [0, -3, 0] }}
              transition={{ duration: 0.85, repeat: Infinity, delay: i * 0.14 }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
