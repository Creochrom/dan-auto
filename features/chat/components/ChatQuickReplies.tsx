"use client";

import { motion } from "framer-motion";
import type { SuggestionChip } from "@/lib/types/intake";
import type { AdvisorChatTheme } from "@/features/chat/hooks/useAdvisorChat";

const CHIP_STYLES: Record<AdvisorChatTheme, string> = {
  gold: "border-[#d4a63c]/24 bg-[#d4a63c]/[0.06] text-[#e8d4a8] hover:border-[#d4a63c]/45 hover:bg-[#d4a63c]/10 active:scale-[0.98]",
  cyan: "border-cyan/24 bg-cyan/8 text-cyan-100 hover:border-cyan/45 hover:bg-cyan/12 active:scale-[0.98]",
};

type Props = {
  chips: SuggestionChip[];
  onSelect?: (chip: SuggestionChip) => void;
  disabled?: boolean;
  theme?: AdvisorChatTheme;
  /** Inline under a message (wrap, max ~2 rows) vs horizontal scroll strip */
  layout?: "inline" | "scroll";
};

export function ChatQuickReplies({
  chips,
  onSelect,
  disabled,
  theme = "gold",
  layout = "inline",
}: Props) {
  if (!chips.length) return null;

  if (layout === "scroll") {
    return (
      <div className="chat-quick-replies-wrap">
        <div className="chat-quick-replies-fade chat-quick-replies-fade--left" aria-hidden />
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="chat-quick-replies-scroller flex flex-nowrap gap-1.5"
          role="list"
        >
          {chips.map((chip) => (
            <ChipButton
              key={chip.id}
              chip={chip}
              disabled={disabled}
              theme={theme}
              onSelect={onSelect}
            />
          ))}
        </motion.div>
        <div className="chat-quick-replies-fade chat-quick-replies-fade--right" aria-hidden />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="chat-inline-replies"
      role="list"
    >
      {chips.map((chip) => (
        <ChipButton
          key={chip.id}
          chip={chip}
          disabled={disabled}
          theme={theme}
          onSelect={onSelect}
        />
      ))}
    </motion.div>
  );
}

function ChipButton({
  chip,
  disabled,
  theme,
  onSelect,
}: {
  chip: SuggestionChip;
  disabled?: boolean;
  theme: AdvisorChatTheme;
  onSelect?: (chip: SuggestionChip) => void;
}) {
  return (
    <button
      type="button"
      role="listitem"
      disabled={disabled}
      onClick={() => onSelect?.(chip)}
      className={`chat-inline-replies__chip ${CHIP_STYLES[theme]} ${disabled ? "opacity-40" : ""}`}
    >
      {chip.label}
    </button>
  );
}
