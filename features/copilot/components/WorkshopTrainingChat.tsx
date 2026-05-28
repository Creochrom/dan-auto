"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send } from "lucide-react";
import { askWorkshopCopilot } from "@/features/copilot/services/copilot-client";
import {
  COPILOT_PROMPT_KINDS,
  type CopilotPromptKind,
} from "@/features/copilot/types/copilot";

const KIND_LABELS: Record<CopilotPromptKind, string> = {
  diagnostics: "Diagnostics",
  customer_explanation: "Customer explanation",
  workshop_notes: "Workshop notes",
  intake_frontdesk_summary: "Front desk summary",
  intake_service_category: "Service category",
};

type TrainingTurn = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sourceCount?: number;
};

function turnId() {
  return `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function buildConversationContext(turns: TrainingTurn[]): string | undefined {
  if (turns.length === 0) return undefined;
  const recent = turns.slice(-8);
  return recent.map((t) => `${t.role === "user" ? "Technician" : "Copilot"}: ${t.content}`).join("\n\n");
}

export function WorkshopTrainingChat() {
  const [promptKind, setPromptKind] = useState<CopilotPromptKind>("diagnostics");
  const [jobContext, setJobContext] = useState("");
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<TrainingTurn[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, loading]);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const text = input.trim();
      if (!text || loading) return;

      const userTurn: TrainingTurn = { id: turnId(), role: "user", content: text };
      setTurns((prev) => [...prev, userTurn]);
      setInput("");
      setLoading(true);
      setError(null);

      try {
        const conversation = buildConversationContext([...turns, userTurn]);
        const contextParts = [jobContext.trim(), conversation].filter(Boolean);
        const result = await askWorkshopCopilot({
          message: text,
          promptKind,
          context: contextParts.length ? contextParts.join("\n\n---\n\n") : undefined,
        });

        setTurns((prev) => [
          ...prev,
          {
            id: turnId(),
            role: "assistant",
            content: result.reply,
            sourceCount: result.sources.length,
          },
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Copilot request failed");
      } finally {
        setLoading(false);
      }
    },
    [input, loading, turns, promptKind, jobContext]
  );

  return (
    <div className="flex min-h-[min(70vh,640px)] flex-col rounded-2xl border border-white/[0.08] bg-black/50">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan/15 text-cyan">
            <Bot className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">Workshop AI training</p>
            <p className="text-xs text-zinc-500">
              Practice queries — answers use workshop docs when AnythingLLM is enabled
            </p>
          </div>
        </div>
        <select
          value={promptKind}
          onChange={(e) => setPromptKind(e.target.value as CopilotPromptKind)}
          className="input-premium rounded-lg px-2 py-1.5 text-xs text-white"
          disabled={loading}
          aria-label="Prompt type"
        >
          {COPILOT_PROMPT_KINDS.map((k) => (
            <option key={k} value={k}>
              {KIND_LABELS[k]}
            </option>
          ))}
        </select>
      </header>

      <div className="border-b border-white/[0.06] px-4 py-2">
        <input
          type="text"
          value={jobContext}
          onChange={(e) => setJobContext(e.target.value)}
          placeholder="Optional job context: reg, mileage, model…"
          className="input-premium w-full rounded-lg px-3 py-2 text-xs text-zinc-300"
          disabled={loading}
        />
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
        aria-live="polite"
      >
        {turns.length === 0 && !loading && (
          <p className="text-center text-sm text-zinc-500">
            Try a golden query:{" "}
            <span className="text-zinc-400">Common N47 timing chain symptoms</span> or{" "}
            <span className="text-zinc-400">Injector replacement torque sequence</span>
          </p>
        )}
        {turns.map((turn) => (
          <div
            key={turn.id}
            className={`max-w-[92%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
              turn.role === "user"
                ? "ml-auto bg-[#d4a63c]/15 text-white"
                : "mr-auto border border-white/[0.08] bg-black/60 text-zinc-300"
            }`}
          >
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
              {turn.role === "user" ? "You" : "Copilot"}
              {turn.sourceCount != null && turn.sourceCount > 0
                ? ` · ${turn.sourceCount} source(s)`
                : ""}
            </p>
            <p className="whitespace-pre-wrap">{turn.content}</p>
          </div>
        ))}
        {loading && (
          <p className="flex items-center gap-2 text-sm text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Searching manuals and generating reply…
          </p>
        )}
        {error && <p className="text-sm text-amber-400">{error}</p>}
      </div>

      <form
        onSubmit={onSubmit}
        className="flex gap-2 border-t border-white/[0.08] p-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about procedures, MOT, diagnostics…"
          className="input-premium min-w-0 flex-1 rounded-xl px-4 py-3 text-sm text-white"
          disabled={loading}
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn-glow flex shrink-0 items-center justify-center gap-2 rounded-full px-5 py-3 font-semibold text-black disabled:opacity-50"
          aria-label="Send message"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </div>
  );
}
