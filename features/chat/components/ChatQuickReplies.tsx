"use client";

import { motion } from "framer-motion";
import type { SuggestionChip } from "@/lib/types/intake";
import type { AdvisorChatTheme } from "@/features/chat/hooks/useAdvisorChat";

const CHIP_STYLES: Record<AdvisorChatTheme, string> = {
  gold: "border-[#d4a63c]/25 bg-[#d4a63c]/[0.06] text-[#e8d4a8] hover:border-[#d4a63c]/45 hover:bg-[#d4a63c]/12",
  cyan: "border-cyan/25 bg-cyan/8 text-cyan-100 hover:border-cyan/45 hover:bg-cyan/12",
};

const CHIP_HISTORY: Record<AdvisorChatTheme, string> = {
  gold: "border-[#d4a63c]/12 bg-[#d4a63c]/[0.03] text-[#d4a63c]/45",
  cyan: "border-cyan/12 bg-cyan/5 text-cyan-600/80",
};

type Props = {
  chips: SuggestionChip[];
  onSelect?: (chip: SuggestionChip) => void;
  disabled?: boolean;
  theme?: AdvisorChatTheme;
  variant?: "active" | "history";
};

export function ChatQuickReplies({
  chips,
  onSelect,
  disabled,
  theme = "gold",
  variant = "active",
}: Props) {
  if (!chips.length) return null;

  const isHistory = variant === "history";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap gap-1.5"
    >
      {chips.map((chip) =>
        isHistory ? (
          <span
            key={chip.id}
            className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${CHIP_HISTORY[theme]}`}
          >
            {chip.label}
          </span>
        ) : (
          <button
            key={chip.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect?.(chip)}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition disabled:opacity-40 ${CHIP_STYLES[theme]}`}
          >
            {chip.label}
          </button>
        )
      )}
    </motion.div>
  );
}

// fix typo isUser -> removed
