"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Loader2, Send, Sparkles, X } from "lucide-react";
import { AdvisorWorkshopIntro } from "@/features/chat/components/AdvisorWorkshopIntro";
import { ChatTimeline } from "@/features/chat/components/ChatTimeline";
import { IntakeMediaUpload } from "@/features/booking/components/IntakeMediaUpload";
import {
  BOOKING_INTRO_BODY,
  BOOKING_INTRO_PROMPT,
  BOOKING_INTRO_TITLE,
  BOOKING_QUICK_START_ACTIONS,
  type QuickStartAction,
} from "@/lib/config/advisor-copy";
import { useBookingIntakeChat } from "@/features/booking/hooks/useBookingIntakeChat";
import { useMediaUpload } from "@/features/booking/hooks/useMediaUpload";
import { completeBookingIntake } from "@/lib/api/client";
import { BOOKING_INTAKE_COPY } from "@/lib/config/booking-copy";
import { LAYER } from "@/lib/ui/layers";
import type { BookingChatContext } from "@/lib/types/chat";

type Props = {
  open: boolean;
  bookingContext: BookingChatContext;
  registrationHint?: string;
  onClose: () => void;
  onSubmitted: () => void;
};

export function BookingIntakeModal({
  open,
  bookingContext,
  registrationHint,
  onClose,
  onSubmitted,
}: Props) {
  const [draft, setDraft] = useState("");
  const [selectedQuickStart, setSelectedQuickStart] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const media = useMediaUpload();
  const chat = useBookingIntakeChat(
    open ? bookingContext : null,
    media.uploadIds
  );

  useEffect(() => {
    if (open) void chat.bootstrap();
  }, [open, chat.bootstrap]);

  const handleQuickStart = (action: QuickStartAction) => {
    setSelectedQuickStart(action.id);
    void chat.send(action.message, {
      displayContent: action.label,
      source: "quick_reply",
      registration: registrationHint,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    void chat.send(text, { registration: registrationHint });
  };

  const bookingIntro = (
    <AdvisorWorkshopIntro
      title={BOOKING_INTRO_TITLE}
      body={BOOKING_INTRO_BODY}
      prompt={BOOKING_INTRO_PROMPT}
      actions={BOOKING_QUICK_START_ACTIONS}
      selectedActionId={chat.messages.length === 0 ? selectedQuickStart : null}
      onSelectAction={handleQuickStart}
      disabled={chat.isTyping || submitting}
    />
  );

  const finalize = async () => {
    if (!chat.sessionId || !chat.intakeComplete) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await completeBookingIntake({
        service: bookingContext.service,
        preferredDate: bookingContext.preferredDate,
        preferredTime: bookingContext.preferredTime,
        chatSessionId: chat.sessionId,
        uploadIds: media.uploadIds,
        registration: registrationHint,
      });
      media.clear();
      onSubmitted();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Could not send request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`booking-intake-backdrop fixed inset-0 flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4 ${LAYER.modalBackdrop}`}
          role="dialog"
          aria-modal
          aria-label={BOOKING_INTAKE_COPY.modalTitle}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.99 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="booking-intake-modal flex h-[100dvh] max-h-[100dvh] w-full max-w-4xl flex-col overflow-hidden rounded-none border border-cyan/20 bg-[#060504] shadow-2xl sm:h-auto sm:max-h-[88dvh] sm:rounded-2xl md:max-h-[90dvh]"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/8 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5 sm:pt-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan/15 ring-1 ring-cyan/30">
                  <Bot className="h-4 w-4 text-cyan" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {BOOKING_INTAKE_COPY.modalTitle}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    {BOOKING_INTAKE_COPY.modalSubtitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-zinc-400 hover:text-white"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="grid min-h-0 flex-1 md:grid-cols-[1fr_260px] lg:grid-cols-[1fr_280px]">
              <div className="flex min-h-0 flex-col border-b border-white/8 md:border-b-0 md:border-r">
                <ChatTimeline
                  messages={chat.messages}
                  isTyping={chat.isTyping}
                  typingLabel={chat.typingLabel}
                  onQuickReply={(chip) =>
                    chat.sendQuickReply(chip, registrationHint)
                  }
                  error={chat.error}
                  theme="cyan"
                  quickRepliesDisabled={chat.isTyping || submitting}
                  intro={bookingIntro}
                />

                <form
                  onSubmit={handleSubmit}
                  className="flex shrink-0 gap-2 border-t border-white/8 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4"
                >
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Tell us what's happening with the vehicle…"
                    disabled={chat.isTyping || submitting}
                    className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/55 px-3 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-cyan/40 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={chat.isTyping || !draft.trim() || submitting}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan text-black disabled:opacity-40"
                    aria-label="Send"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>

              <aside className="flex max-h-[38dvh] min-h-0 shrink-0 flex-col gap-3 overflow-y-auto p-3 sm:max-h-none sm:p-4 md:max-h-none">
                <IntakeMediaUpload
                  items={media.items}
                  onAdd={media.addFiles}
                  onRemove={media.remove}
                  disabled={submitting}
                />
                <p className="text-[10px] leading-relaxed text-zinc-600">
                  {BOOKING_INTAKE_COPY.disclaimer}
                </p>
                {chat.intakeComplete && (
                  <button
                    type="button"
                    onClick={() => void finalize()}
                    disabled={submitting}
                    className="btn-glow flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-bold text-black disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {BOOKING_INTAKE_COPY.submitting}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        {BOOKING_INTAKE_COPY.submitRequest}
                      </>
                    )}
                  </button>
                )}
                {submitError && (
                  <p className="text-[11px] text-red-400">{submitError}</p>
                )}
              </aside>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
