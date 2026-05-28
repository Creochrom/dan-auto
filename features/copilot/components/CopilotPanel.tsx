"use client";

import { useCallback, useState } from "react";
import { Bot, Loader2, Send, X } from "lucide-react";
import { askWorkshopCopilot } from "@/features/copilot/services/copilot-client";
import {
  COPILOT_PROMPT_KINDS,
  type CopilotAskResult,
  type CopilotPromptKind,
} from "@/features/copilot/types/copilot";

const KIND_LABELS: Record<CopilotPromptKind, string> = {
  diagnostics: "Diagnostics",
  customer_explanation: "Customer explanation",
  workshop_notes: "Workshop notes",
  intake_frontdesk_summary: "Front desk summary",
  intake_service_category: "Service category",
};

export function CopilotPanel() {
  const [open, setOpen] = useState(false);
  const [promptKind, setPromptKind] = useState<CopilotPromptKind>("diagnostics");
  const [message, setMessage] = useState("");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<CopilotAskResult | null>(null);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!message.trim() || loading) return;

      setLoading(true);
      setError(null);

      try {
        const result = await askWorkshopCopilot({
          message: message.trim(),
          promptKind,
          context: context.trim() || undefined,
        });
        setLastResult(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Copilot request failed");
        setLastResult(null);
      } finally {
        setLoading(false);
      }
    },
    [message, promptKind, context, loading]
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-[#d4a63c]/40 bg-black/90 px-4 py-2.5 text-sm font-semibold text-[#d4a63c] shadow-lg backdrop-blur hover:bg-[#d4a63c]/10"
        aria-label="Open workshop copilot"
      >
        <Bot className="h-4 w-4" />
        Copilot
      </button>
    );
  }

  return (
    <aside
      className="fixed bottom-4 right-4 z-50 flex w-[min(100vw-2rem,22rem)] flex-col rounded-2xl border border-white/10 bg-[#0a0a0a]/95 shadow-2xl backdrop-blur"
      aria-label="Workshop copilot panel"
    >
      <header className="flex items-center justify-between border-b border-white/10 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-cyan" />
          <span className="text-sm font-semibold text-white">Workshop copilot</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg p-1 text-zinc-500 hover:bg-white/5 hover:text-white"
          aria-label="Close copilot"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-2 p-3">
        <label className="sr-only" htmlFor="copilot-kind">
          Prompt type
        </label>
        <select
          id="copilot-kind"
          value={promptKind}
          onChange={(e) => setPromptKind(e.target.value as CopilotPromptKind)}
          className="input-premium rounded-lg px-2 py-1.5 text-xs text-white"
          disabled={loading}
        >
          {COPILOT_PROMPT_KINDS.map((k) => (
            <option key={k} value={k}>
              {KIND_LABELS[k]}
            </option>
          ))}
        </select>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Symptoms, question, or job context…"
          rows={3}
          className="input-premium w-full resize-none rounded-lg px-3 py-2 text-sm text-white"
          disabled={loading}
          required
        />

        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Optional: reg, mileage, prior notes…"
          rows={2}
          className="input-premium w-full resize-none rounded-lg px-3 py-2 text-xs text-zinc-300"
          disabled={loading}
        />

        <button
          type="submit"
          disabled={loading || !message.trim()}
          className="btn-glow flex items-center justify-center gap-2 rounded-full py-2 text-sm font-semibold text-black disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {loading ? "Thinking…" : "Ask"}
        </button>
      </form>

      <div className="max-h-48 overflow-y-auto border-t border-white/10 px-3 py-2">
        {error && <p className="text-xs text-amber-400">{error}</p>}
        {!error && loading && (
          <p className="text-xs text-zinc-500">Generating reply…</p>
        )}
        {!error && !loading && lastResult && (
          <>
            <p className="mb-1 text-[10px] uppercase tracking-wider text-zinc-600">
              {KIND_LABELS[lastResult.promptKind]} · {lastResult.provider}
            </p>
            <p className="whitespace-pre-wrap text-xs leading-relaxed text-zinc-300">
              {lastResult.reply}
            </p>
            {lastResult.sources.length > 0 && (
              <p className="mt-2 text-[10px] text-zinc-600">
                {lastResult.sources.length} knowledge chunk(s) retrieved
              </p>
            )}
          </>
        )}
        {!error && !loading && !lastResult && (
          <p className="text-xs text-zinc-600">
            Internal assistant — manuals & RAG via AnythingLLM when enabled.
          </p>
        )}
      </div>
    </aside>
  );
}
