"use client";

import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import {
  AlertTriangle,
  Bot,
  Copy,
  FileText,
  Loader2,
  Paperclip,
  RefreshCcw,
  Send,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { askWorkshopCopilot } from "@/features/copilot/services/copilot-client";
import {
  COPILOT_PROMPT_KINDS,
  type CopilotPromptKind,
} from "@/features/copilot/types/copilot";
import type { WorkshopJobContextStub } from "@/features/copilot/utils/workshop-job-context";

const KIND_LABELS: Record<CopilotPromptKind, string> = {
  diagnostics: "Diagnostics",
  customer_explanation: "Customer wording",
  workshop_notes: "Workshop notes",
  intake_frontdesk_summary: "Front desk summary",
  intake_service_category: "Service category",
};

const KIND_HINTS: Record<CopilotPromptKind, string> = {
  diagnostics: "Checks · causes · bay steps",
  customer_explanation: "SMS / WhatsApp draft",
  workshop_notes: "Job card · handover",
  intake_frontdesk_summary: "Booking intake · reception",
  intake_service_category: "Bay category suggestion",
};

const QUICK_PROMPTS: {
  label: string;
  kind: CopilotPromptKind;
  message: string;
}[] = [
  {
    label: "Diagnose",
    kind: "diagnostics",
    message:
      "Help me diagnose this issue. List likely causes, checks in order, and what to confirm before parts ordering.",
  },
  {
    label: "Customer text",
    kind: "customer_explanation",
    message:
      "Draft a clear, non-technical explanation for the customer about the fault and recommended repair.",
  },
  {
    label: "Job notes",
    kind: "workshop_notes",
    message:
      "Generate structured workshop job notes: findings, work carried out, parts, advisories, and handover points.",
  },
  {
    label: "MOT",
    kind: "diagnostics",
    message:
      "Provide MOT guidance for this case: likely pass/fail points, advisories to mention, and checks to complete first.",
  },
  {
    label: "Torque",
    kind: "diagnostics",
    message:
      "List the torque specs and tightening sequence I should verify for this repair, plus key safety cautions.",
  },
  {
    label: "Common faults",
    kind: "diagnostics",
    message:
      "Give common faults for this symptom pattern, fastest confirm/deny tests, and likely next actions in the bay.",
  },
];

type ChatTurn = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sourceCount?: number;
  attachmentNames?: string[];
};

type AttachedFile = {
  id: string;
  name: string;
  size: number;
  type: string;
};

export type WorkshopAssistantProps = {
  jobStub?: WorkshopJobContextStub | null;
  queryJobId?: string | null;
  queryReg?: string | null;
  initialJobs?: Array<{ id: string; registration: string; service: string }>;
};

function turnId() {
  return `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function fileId() {
  return `f_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function buildConversationContext(turns: ChatTurn[]): string | undefined {
  if (turns.length === 0) return undefined;
  return turns
    .slice(-8)
    .map((t) => `${t.role === "user" ? "Technician" : "Assistant"}: ${t.content}`)
    .join("\n\n");
}

function attachmentContextNote(files: AttachedFile[]): string | undefined {
  if (files.length === 0) return undefined;
  const names = files.map((f) => f.name).join(", ");
  return `[Attached files (filenames only — content not uploaded to server yet): ${names}]`;
}

export function WorkshopAssistant({
  jobStub = null,
  queryJobId = null,
  queryReg = null,
  initialJobs = [],
}: WorkshopAssistantProps) {
  const [promptKind, setPromptKind] = useState<CopilotPromptKind>("diagnostics");
  const [jobContext, setJobContext] = useState("");
  const [selectedJobId, setSelectedJobId] = useState<string>(queryJobId ?? "");
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [lastSubmitted, setLastSubmitted] = useState<{
    message: string;
    kind: CopilotPromptKind;
    context: string;
    attachmentNames: string[];
  } | null>(null);

  useEffect(() => {
    if (!jobStub) return;
    setJobContext((prev) => (prev.trim() ? prev : jobStub.contextLine));
  }, [jobStub]);

  useEffect(() => {
    if (queryJobId) {
      setSelectedJobId(queryJobId);
    }
  }, [queryJobId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [turns, loading]);

  const addFiles = useCallback((fileList: FileList | File[]) => {
    const next: AttachedFile[] = [];
    for (const file of Array.from(fileList)) {
      next.push({
        id: fileId(),
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
      });
    }
    if (next.length === 0) return;
    setAttachments((prev) => [...prev, ...next]);
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const applyQuickPrompt = useCallback((prompt: (typeof QUICK_PROMPTS)[number]) => {
    setPromptKind(prompt.kind);
    setInput(prompt.message);
    textareaRef.current?.focus();
  }, []);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const text = input.trim();
      if (!text || loading) return;

      const names = attachments.map((f) => f.name);
      const jobContextTrimmed = jobContext.trim();
      const userTurn: ChatTurn = {
        id: turnId(),
        role: "user",
        content: text,
        attachmentNames: names.length > 0 ? names : undefined,
      };

      setTurns((prev) => [...prev, userTurn]);
      setInput("");
      setLoading(true);
      setError(null);

      try {
        const conversation = buildConversationContext([...turns, userTurn]);
        const contextParts = [
          jobContextTrimmed,
          conversation,
          attachmentContextNote(attachments),
        ].filter(Boolean);
        const mergedContext = contextParts.length ? contextParts.join("\n\n---\n\n") : undefined;

        const result = await askWorkshopCopilot({
          message: text,
          promptKind,
          context: mergedContext,
          jobId: selectedJobId || undefined,
          jobSnapshot:
            !selectedJobId && queryReg && jobContextTrimmed
              ? { registration: queryReg, symptoms: jobContextTrimmed }
              : undefined,
        });
        setLastSubmitted({
          message: text,
          kind: promptKind,
          context: jobContextTrimmed,
          attachmentNames: names,
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
    [input, loading, turns, promptKind, jobContext, attachments, selectedJobId, queryReg]
  );

  const copyLatestAssistant = useCallback(async () => {
    const latest = [...turns].reverse().find((t) => t.role === "assistant");
    if (!latest) return;
    try {
      await navigator.clipboard.writeText(latest.content);
    } catch {
      setError("Could not copy draft. Select and copy manually.");
    }
  }, [turns]);

  const regenerateLast = useCallback(async () => {
    if (!lastSubmitted || loading) return;
    setLoading(true);
    setError(null);
    try {
      const contextParts = [
        lastSubmitted.context,
        attachmentContextNote(
          lastSubmitted.attachmentNames.map((name) => ({
            id: fileId(),
            name,
            size: 0,
            type: "application/octet-stream",
          }))
        ),
      ].filter(Boolean);

      const result = await askWorkshopCopilot({
        message: lastSubmitted.message,
        promptKind: lastSubmitted.kind,
        context: contextParts.length ? contextParts.join("\n\n---\n\n") : undefined,
        jobId: selectedJobId || undefined,
        jobSnapshot:
          !selectedJobId && queryReg && lastSubmitted.context.trim()
            ? { registration: queryReg, symptoms: lastSubmitted.context.trim() }
            : undefined,
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
      setError(err instanceof Error ? err.message : "Could not regenerate draft");
    } finally {
      setLoading(false);
    }
  }, [lastSubmitted, loading, selectedJobId, queryReg]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* Draft-only — human sends (WORKSHOP_ECOSYSTEM §2) */}
      <div
        className="flex shrink-0 items-start gap-3 rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-3"
        role="status"
      >
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-100">Draft only — you send</p>
          <p className="mt-0.5 text-xs leading-relaxed text-amber-200/80">
            Suggestions only. Nothing goes to the customer until you copy and send via WhatsApp,
            SMS, or in person.
          </p>
        </div>
      </div>

      {jobStub && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 rounded-xl border border-cyan/25 bg-cyan/5 px-3 py-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan/80">
            Job link
          </span>
          <span className="text-sm font-medium text-white">{jobStub.displayLabel}</span>
          {queryJobId && (
            <span className="rounded-md bg-black/40 px-2 py-0.5 font-mono text-[10px] text-zinc-500">
              jobId={queryJobId}
            </span>
          )}
          {queryReg && !jobStub.reg && (
            <span className="rounded-md bg-black/40 px-2 py-0.5 font-mono text-[10px] text-zinc-500">
              reg={queryReg}
            </span>
          )}
          <span className="w-full text-[11px] text-zinc-500">
            Full job preload when jobs API is live — context field pre-filled below.
          </span>
        </div>
      )}

      {/* Prompt modes — always visible (tablet / bay) */}
      <div className="shrink-0">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          Prompt mode
        </p>
        <div
          className="grid grid-cols-1 gap-2 sm:grid-cols-3"
          role="tablist"
          aria-label="Prompt mode"
        >
          {COPILOT_PROMPT_KINDS.map((kind) => {
            const active = promptKind === kind;
            return (
              <button
                key={kind}
                type="button"
                role="tab"
                aria-selected={active}
                disabled={loading}
                onClick={() => setPromptKind(kind)}
                className={`min-h-[3.25rem] rounded-xl border px-3 py-2.5 text-left transition touch-manipulation ${
                  active
                    ? "border-[#d4a63c]/50 bg-[#d4a63c]/15 ring-1 ring-[#d4a63c]/30"
                    : "border-white/10 bg-white/[0.03] active:bg-white/[0.06]"
                } disabled:opacity-50`}
              >
                <span
                  className={`block text-sm font-semibold ${active ? "text-[#e8d5a3]" : "text-zinc-200"}`}
                >
                  {KIND_LABELS[kind]}
                </span>
                <span className="mt-0.5 block text-[11px] text-zinc-500">{KIND_HINTS[kind]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-black/50 shadow-[0_0_40px_rgba(212,166,60,0.05)]">
        <header className="shrink-0 border-b border-white/[0.08] px-3 py-3 sm:px-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#d4a63c]/25 to-cyan/10 text-[#d4a63c] ring-1 ring-[#d4a63c]/30">
              <Bot className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-white">Draft assistant</h2>
              <p className="text-xs text-zinc-500">Gemini · manuals when RAG enabled</p>
            </div>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt.label}
                type="button"
                disabled={loading}
                onClick={() => applyQuickPrompt(prompt)}
                className="inline-flex min-h-[2.75rem] shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-medium text-zinc-300 touch-manipulation active:bg-[#d4a63c]/10 disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5 text-[#d4a63c]" aria-hidden />
                {prompt.label}
              </button>
            ))}
          </div>

          <label className="mt-3 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Active job
          </label>
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="input-premium mt-1.5 w-full rounded-xl px-3 py-3 text-sm text-zinc-200 touch-manipulation"
            disabled={loading || initialJobs.length === 0}
          >
            <option value="">No linked job (use context snapshot)</option>
            {initialJobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.registration} · {job.service}
              </option>
            ))}
          </select>
          <label className="mt-3 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Vehicle / job context
          </label>
          <input
            type="text"
            value={jobContext}
            onChange={(e) => setJobContext(e.target.value)}
            placeholder="Reg, mileage, model, symptoms, prior notes…"
            className="input-premium mt-1.5 w-full rounded-xl px-3 py-3 text-sm text-zinc-200 touch-manipulation"
            disabled={loading}
          />
        </header>

        <div
          ref={scrollRef}
          className="min-h-[12rem] flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:min-h-[16rem] sm:px-4"
          aria-live="polite"
        >
          {turns.length === 0 && !loading && (
            <div className="py-8 text-center sm:py-10">
              <p className="text-sm text-zinc-400">
                Pick a mode above, then ask or tap a quick prompt.
              </p>
              <p className="mt-2 text-xs text-zinc-600">
                Copy the draft when ready — you send it to the customer.
              </p>
            </div>
          )}

          {turns.map((turn) => (
            <div
              key={turn.id}
              className={`max-w-[min(100%,40rem)] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                turn.role === "user"
                  ? "ml-auto bg-[#d4a63c]/12 text-white ring-1 ring-[#d4a63c]/25"
                  : "mr-auto border border-white/[0.08] bg-[#0a0a0a]/80 text-zinc-300"
              }`}
            >
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                {turn.role === "user" ? "You" : "Draft"}
                {turn.sourceCount != null && turn.sourceCount > 0
                  ? ` · ${turn.sourceCount} manual source(s)`
                  : ""}
              </p>
              <p className="whitespace-pre-wrap">{turn.content}</p>
              {turn.attachmentNames && turn.attachmentNames.length > 0 && (
                <p className="mt-2 flex flex-wrap gap-1 text-[10px] text-zinc-500">
                  {turn.attachmentNames.map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center gap-1 rounded-md bg-black/40 px-2 py-0.5"
                    >
                      <Paperclip className="h-3 w-3" />
                      {name}
                    </span>
                  ))}
                </p>
              )}
            </div>
          ))}

          {loading && (
            <p className="flex items-center gap-2 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin text-cyan" />
              Drafting…
            </p>
          )}
          {error && (
            <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-200">
              {error}
            </p>
          )}
        </div>

        {/* Actions — visible on tablet (no hidden sidebar) */}
        <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-white/[0.08] bg-black/30 p-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => void copyLatestAssistant()}
            className="flex min-h-[2.75rem] items-center justify-center gap-2 rounded-xl border border-white/10 text-xs font-medium text-zinc-300 touch-manipulation active:bg-white/5"
          >
            <Copy className="h-4 w-4" />
            Copy draft
          </button>
          <button
            type="button"
            onClick={() => void regenerateLast()}
            disabled={!lastSubmitted || loading}
            className="flex min-h-[2.75rem] items-center justify-center gap-2 rounded-xl border border-white/10 text-xs font-medium text-zinc-300 touch-manipulation active:bg-white/5 disabled:opacity-50"
          >
            <RefreshCcw className="h-4 w-4" />
            Regenerate
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="col-span-2 flex min-h-[2.75rem] items-center justify-center gap-2 rounded-xl border border-white/10 text-xs font-medium text-zinc-300 touch-manipulation active:bg-white/5 disabled:opacity-50 sm:col-span-1"
          >
            <Paperclip className="h-4 w-4" />
            Attach {attachments.length > 0 ? `(${attachments.length})` : ""}
          </button>
        </div>

        {attachments.length > 0 && (
          <ul className="flex shrink-0 gap-2 overflow-x-auto border-t border-white/[0.06] px-3 py-2 [-webkit-overflow-scrolling:touch]">
            {attachments.map((file) => (
              <li
                key={file.id}
                className="flex max-w-[14rem] shrink-0 items-center gap-2 rounded-lg border border-white/[0.08] bg-black/50 px-2.5 py-2"
              >
                <FileText className="h-4 w-4 shrink-0 text-[#d4a63c]" />
                <div className="min-w-0">
                  <p className="truncate text-xs text-zinc-200">{file.name}</p>
                  <p className="text-[10px] text-zinc-600">{formatBytes(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(file.id)}
                  className="rounded-lg p-2 text-zinc-500 touch-manipulation active:bg-white/10"
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
            <li className="shrink-0">
              <button
                type="button"
                onClick={() => setAttachments([])}
                className="flex min-h-[2.75rem] items-center gap-1 rounded-lg border border-white/10 px-3 text-xs text-zinc-500 touch-manipulation"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </button>
            </li>
          </ul>
        )}

        <form
          onSubmit={onSubmit}
          className="shrink-0 border-t border-white/[0.08] p-3 sm:p-4"
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <div
            className={`rounded-xl border border-dashed px-3 py-2 transition ${
              dragOver ? "border-cyan/50 bg-cyan/5" : "border-white/10 bg-white/[0.02]"
            }`}
          >
            <p className="flex items-center justify-center gap-2 text-[11px] text-zinc-600">
              <Upload className="h-3.5 w-3.5" />
              Drop PDFs or images (filenames as context only)
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,image/*,.doc,.docx"
            className="sr-only"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = "";
            }}
          />

          <div className="mt-3 flex gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void onSubmit(e);
                }
              }}
              placeholder="Symptoms, procedure, or customer wording to draft…"
              rows={3}
              className="input-premium min-h-[4.5rem] min-w-0 flex-1 resize-y rounded-xl px-4 py-3 text-base text-white touch-manipulation sm:text-sm"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-glow flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-full font-semibold text-black touch-manipulation disabled:opacity-50 sm:h-auto sm:w-auto sm:px-5"
              aria-label="Get draft"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
