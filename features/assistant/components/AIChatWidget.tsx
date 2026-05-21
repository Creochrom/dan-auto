"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, MessageCircle, Minus, RotateCcw, Send, Sparkles, X } from "lucide-react";
import { ChatTimeline } from "@/features/chat/components/ChatTimeline";
import { useAssistant } from "@/features/assistant/AssistantContext";
import { useChatSession } from "@/features/assistant/hooks/useChatSession";
import { WHATSAPP_HREF, businessConfig } from "@/lib/config";

export function AIChatWidget() {
  const { open, setOpen } = useAssistant();
  const [draft, setDraft] = useState("");
  const {
    messages,
    isTyping,
    typingLabel,
    suggestionChips,
    error,
    send,
    sendQuickReply,
    bootstrap,
    reset,
  } = useChatSession();

  useEffect(() => {
    if (open) void bootstrap();
  }, [open, bootstrap]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    void send(text);
  };

  return (
    <div className="pointer-events-none fixed bottom-20 right-3 z-[90] flex flex-col items-end gap-3 sm:bottom-6 sm:right-5">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.97 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="service-advisor-panel pointer-events-auto flex h-[min(78dvh,560px)] w-[min(94vw,400px)] flex-col overflow-hidden rounded-[1.35rem] border border-[#d4a63c]/28 bg-[linear-gradient(165deg,#0c0a08_0%,#060504_55%,#0a0806_100%)] shadow-[0_28px_72px_rgba(0,0,0,0.72),0_0_48px_rgba(212,166,60,0.1)] backdrop-blur-2xl"
            role="dialog"
            aria-label="Dana Auto Centre service advisor"
          >
            <header className="relative flex items-start justify-between gap-3 border-b border-[#d4a63c]/18 px-4 py-3.5">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d4a63c]/50 to-transparent" />
              <div className="flex items-center gap-3">
                <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#d4a63c]/12 ring-1 ring-[#d4a63c]/35">
                  <Bot className="h-[18px] w-[18px] text-[#d4a63c]" aria-hidden />
                  <Sparkles
                    className="absolute -right-0.5 -top-0.5 h-3 w-3 text-[#d4a63c]/70"
                    aria-hidden
                  />
                </span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#d4a63c]">
                    Service advisor
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">
                    Diagnostics intake · Workshop callback
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    reset();
                    void bootstrap();
                  }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 text-zinc-500 transition hover:border-[#d4a63c]/25 hover:text-[#d4a63c]"
                  aria-label="Start new conversation"
                  title="New conversation"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 text-zinc-500 transition hover:border-[#d4a63c]/25 hover:text-[#d4a63c]"
                  aria-label="Minimize chat"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 text-zinc-500 transition hover:border-red-500/25 hover:text-red-300"
                  aria-label="Close chat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>

            <ChatTimeline
              messages={messages}
              isTyping={isTyping}
              typingLabel={typingLabel}
              suggestionChips={suggestionChips}
              onQuickReply={(chip) => sendQuickReply(chip)}
              error={error}
              theme="gold"
              quickRepliesDisabled={isTyping}
            />

            <footer className="border-t border-[#d4a63c]/14 px-3.5 py-3 sm:px-4">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Describe symptoms, lights, noises…"
                  className="min-w-0 flex-1 rounded-xl border border-white/[0.08] bg-black/60 px-3.5 py-3 text-[13px] text-white outline-none placeholder:text-zinc-600 focus:border-[#d4a63c]/45 focus:ring-1 focus:ring-[#d4a63c]/20"
                  disabled={isTyping}
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={isTyping || !draft.trim()}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#d4a63c] text-black transition hover:brightness-110 disabled:opacity-35"
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
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen(!open)}
        whileTap={{ scale: 0.96 }}
        className="pointer-events-auto inline-flex items-center gap-2.5 rounded-full border border-[#d4a63c]/38 bg-[#080706]/96 px-4 py-3 text-sm font-semibold text-[#f5e6b8] shadow-[0_14px_44px_rgba(0,0,0,0.55),0_0_32px_rgba(212,166,60,0.18)] backdrop-blur-xl transition hover:border-[#d4a63c]/55 lg:px-5 lg:py-3.5"
        aria-expanded={open}
        aria-label={open ? "Close service advisor" : "Open service advisor"}
      >
        {open ? (
          <Minus className="h-5 w-5 text-[#d4a63c]" />
        ) : (
          <MessageCircle className="h-5 w-5 text-[#d4a63c]" />
        )}
        <span className="hidden sm:inline">
          {open ? "Minimise" : "Service advisor"}
        </span>
      </motion.button>
    </div>
  );
}
