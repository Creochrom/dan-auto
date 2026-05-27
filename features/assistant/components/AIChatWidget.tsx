"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, RotateCcw, Send, X } from "lucide-react";
import { AdvisorMediaBar } from "@/features/chat/components/AdvisorMediaBar";
import { AdvisorWorkshopIntro } from "@/features/chat/components/AdvisorWorkshopIntro";
import { ChatTimeline } from "@/features/chat/components/ChatTimeline";
import { useAssistant } from "@/features/assistant/AssistantContext";
import { useChatSession } from "@/features/assistant/hooks/useChatSession";
import type { IntakeSubmitState } from "@/features/chat/hooks/useAdvisorChat";
import {
  ADVISOR_QUICK_START_ACTIONS,
  WORKSHOP_INTRO_BODY,
  WORKSHOP_INTRO_PROMPT,
  WORKSHOP_INTRO_TITLE,
  type QuickStartAction,
} from "@/lib/config/advisor-copy";
import { BRAND, WHATSAPP_HREF, businessConfig } from "@/lib/config";
import { LAYER } from "@/lib/ui/layers";

function AdvisorPanel({
  draft,
  setDraft,
  onClose,
  onSubmit,
  onReset,
  messages,
  isTyping,
  typingLabel,
  suggestionChips,
  error,
  intakeSubmitState = "idle",
  onRetrySubmit,
  sendQuickReply,
  isTypingDisabled,
  intro,
  mediaItems,
  onMediaAdd,
  onMediaRemove,
}: {
  draft: string;
  setDraft: (v: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
  messages: ReturnType<typeof useChatSession>["messages"];
  isTyping: boolean;
  typingLabel: string | null | undefined;
  suggestionChips: ReturnType<typeof useChatSession>["suggestionChips"];
  error: string | null | undefined;
  intakeSubmitState?: IntakeSubmitState;
  onRetrySubmit?: () => void;
  sendQuickReply: (chip: (typeof suggestionChips)[0]) => void;
  isTypingDisabled: boolean;
  intro: ReactNode;
  mediaItems: ReturnType<typeof useChatSession>["media"]["items"];
  onMediaAdd: ReturnType<typeof useChatSession>["media"]["addFiles"];
  onMediaRemove: ReturnType<typeof useChatSession>["media"]["remove"];
}) {
  return (
    <>
      <header className="service-advisor-panel__header">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#d4a63c]/90">
            Workshop intake
          </p>
          <p className="mt-0.5 text-sm font-semibold text-white">
            {WORKSHOP_INTRO_TITLE}
          </p>
          <p className="mt-0.5 text-[10px] leading-snug text-zinc-500">
            {BRAND.shortName} · After-hours support
          </p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={onReset}
            className="service-advisor-panel__icon-btn"
            aria-label="Start new conversation"
            title="New conversation"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="service-advisor-panel__icon-btn service-advisor-panel__icon-btn--close"
            aria-label="Close service advisor"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <ChatTimeline
        messages={messages}
        isTyping={isTyping}
        typingLabel={typingLabel}
        onQuickReply={sendQuickReply}
        error={error}
        theme="gold"
        quickRepliesDisabled={isTypingDisabled}
        intro={intro}
      />

      <footer className="service-advisor-panel__footer">
        <AdvisorMediaBar
          items={mediaItems}
          onAdd={onMediaAdd}
          onRemove={onMediaRemove}
          disabled={isTypingDisabled}
          compact
        />
        {intakeSubmitState === "sending" && (
          <p className="mb-2 text-[10px] font-medium text-[#d4a63c]">
            Sending workshop intake…
          </p>
        )}
        {intakeSubmitState === "sent" && (
          <p className="mb-2 text-[10px] font-medium text-emerald-400/90">
            Intake sent to the workshop team.
          </p>
        )}
        {intakeSubmitState === "error" && onRetrySubmit && (
          <div className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-red-950/40 px-2.5 py-2">
            <p className="text-[10px] text-red-300">Could not send intake.</p>
            <button
              type="button"
              onClick={onRetrySubmit}
              className="text-[10px] font-semibold text-[#d4a63c] hover:underline"
            >
              Retry
            </button>
          </div>
        )}
        <form onSubmit={onSubmit} className="mt-2 flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Describe symptoms, lights, noises…"
            className="service-advisor-panel__input"
            disabled={isTypingDisabled}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={isTypingDisabled || !draft.trim()}
            className="service-advisor-panel__send"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        <p className="mt-2 text-[9px] leading-relaxed text-zinc-600">
          Indicative guidance only — not a diagnosis or fixed quote. A technician
          confirms after inspection.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          <a
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-semibold text-emerald-400/90 hover:text-emerald-300"
          >
            WhatsApp
          </a>
          <span className="text-zinc-700" aria-hidden>
            ·
          </span>
          <a
            href={businessConfig.phone.telHref}
            className="text-[10px] font-semibold text-[#d4a63c]/85 hover:text-[#d4a63c]"
          >
            Call {businessConfig.phone.display}
          </a>
        </div>
      </footer>
    </>
  );
}

export function AIChatWidget() {
  const { open, setOpen, openAssistant } = useAssistant();
  const [draft, setDraft] = useState("");
  const [selectedQuickStart, setSelectedQuickStart] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const {
    messages,
    isTyping,
    typingLabel,
    suggestionChips,
    error,
    intakeSubmitState,
    send,
    sendQuickReply,
    bootstrap,
    reset,
    retryIntakeSubmit,
    media,
  } = useChatSession();

  const handleQuickStart = useCallback(
    (action: QuickStartAction) => {
      setSelectedQuickStart(action.id);
      void send(action.message, {
        displayContent: action.label,
        source: "quick_reply",
      });
    },
    [send]
  );

  const intro = (
    <AdvisorWorkshopIntro
      title={WORKSHOP_INTRO_TITLE}
      body={WORKSHOP_INTRO_BODY}
      prompt={WORKSHOP_INTRO_PROMPT}
      actions={ADVISOR_QUICK_START_ACTIONS}
      selectedActionId={messages.length === 0 ? selectedQuickStart : null}
      onSelectAction={handleQuickStart}
      disabled={isTyping}
    />
  );

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    void send(text);
  };

  const handleReset = () => {
    setSelectedQuickStart(null);
    media.clear();
    reset();
    void bootstrap();
  };

  const panelProps = {
    draft,
    setDraft,
    onClose: () => setOpen(false),
    onSubmit: handleSubmit,
    onReset: handleReset,
    messages,
    isTyping,
    typingLabel,
    suggestionChips,
    error,
    sendQuickReply,
    intakeSubmitState,
    onRetrySubmit: () => void retryIntakeSubmit(),
    isTypingDisabled: isTyping || intakeSubmitState === "sending",
    intro,
    mediaItems: media.items,
    onMediaAdd: media.addFiles,
    onMediaRemove: media.remove,
  };

  const mobileModal =
    mounted && isMobile && open
      ? createPortal(
          <AnimatePresence>
            <motion.div
              key="advisor-mobile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`service-advisor-mobile-backdrop ${LAYER.assistant}`}
              role="presentation"
            >
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="service-advisor-mobile-panel"
                role="dialog"
                aria-modal
                aria-label={`${BRAND.shortName} service advisor`}
              >
                <AdvisorPanel {...panelProps} />
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body
        )
      : null;

  return (
    <>
      {mobileModal}

      <div
        className={`service-advisor-dock ${LAYER.assistant} ${open && isMobile ? "service-advisor-dock--hidden" : ""}`}
        aria-hidden={open && isMobile}
      >
        <AnimatePresence>
          {open && !isMobile && (
            <motion.div
              key="advisor-desktop"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.99 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="service-advisor-panel pointer-events-auto"
              role="dialog"
              aria-label={`${BRAND.shortName} service advisor`}
            >
              <AdvisorPanel {...panelProps} />
            </motion.div>
          )}
        </AnimatePresence>

        {!open && (
          <motion.button
            type="button"
            onClick={() =>
              openAssistant({
                advisorRoute: {
                  entry_point: "floating_widget",
                  intent: "general",
                  surface: "floating_widget",
                },
              })
            }
            whileTap={{ scale: 0.97 }}
            className={`service-advisor-fab pointer-events-auto ${LAYER.fab}`}
            aria-expanded={open}
            aria-label="Open service advisor"
          >
            <MessageCircle className="h-5 w-5 text-[#d4a63c]" aria-hidden />
            <span className="hidden sm:inline">Service advisor</span>
          </motion.button>
        )}
      </div>
    </>
  );
}
