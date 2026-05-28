"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, Zap } from "lucide-react";
import { adminFetch } from "@/lib/admin/client";
import {
  getActiveJobContext,
  type ActiveJobContext,
} from "@/lib/workshop/active-job-context";
import type { WorkshopSearchGroup } from "@/lib/services/workshop-search-grouped";
import type { WorkshopSearchResult } from "@/lib/services/workshop-search.service";
import {
  buildWorkshopCommands,
  type WorkshopCommand,
} from "@/lib/workshop/workshop-commands";

const KIND_LABEL: Record<WorkshopSearchResult["kind"], string> = {
  job: "Job",
  booking: "Booking",
  lead: "Lead",
  vehicle: "Vehicle",
  manual: "Manual",
  invoice: "Invoice",
  attachment: "Attachment",
};

function ResultRow({
  row,
  active,
  onActivate,
  onHover,
}: {
  row: WorkshopSearchResult;
  active: boolean;
  onActivate: () => void;
  onHover: () => void;
}) {
  return (
    <li key={`${row.kind}-${row.id}`}>
      <button
        type="button"
        className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left ${
          active
            ? "bg-[#d4a63c]/15 ring-1 ring-[#d4a63c]/30"
            : "hover:bg-white/[0.06]"
        }`}
        onMouseEnter={onHover}
        onClick={onActivate}
      >
        <span className="mt-0.5 rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-zinc-400">
          {KIND_LABEL[row.kind]}
        </span>
        <span className="min-w-0">
          <span className="block font-mono text-sm text-[#e8d5a3]">{row.title}</span>
          {row.subtitle && (
            <span className="block truncate text-xs text-zinc-500">{row.subtitle}</span>
          )}
        </span>
      </button>
    </li>
  );
}

type PaletteRow =
  | { type: "command"; command: WorkshopCommand }
  | { type: "result"; result: WorkshopSearchResult };

export function WorkshopCommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [results, setResults] = useState<WorkshopSearchResult[]>([]);
  const [groups, setGroups] = useState<WorkshopSearchGroup[]>([]);
  const [activeJob, setActiveJob] = useState<ActiveJobContext | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const commands = useMemo(
    () => buildWorkshopCommands(query, activeJob),
    [query, activeJob]
  );

  const rows: PaletteRow[] = useMemo(() => {
    const commandRows: PaletteRow[] = commands.map((command) => ({
      type: "command",
      command,
    }));
    const searchRows =
      groups.length > 0
        ? groups.flatMap((group) => group.results)
        : results;
    const resultRows: PaletteRow[] = searchRows.map((result) => ({
      type: "result",
      result,
    }));
    return [...commandRows, ...resultRows];
  }, [commands, groups, results]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, results.length, groups.length, commands.length]);

  useEffect(() => {
    if (open) {
      setActiveJob(getActiveJobContext());
    }
  }, [open]);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setGroups([]);
      return;
    }
    setLoading(true);
    try {
      const res = await adminFetch(
        `/api/admin/search?q=${encodeURIComponent(trimmed)}&grouped=1`,
        { credentials: "include" }
      );
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean;
        data?: {
          results?: WorkshopSearchResult[];
          groups?: WorkshopSearchGroup[];
        };
      } | null;
      if (json?.ok && json.data) {
        setResults(json.data.results ?? []);
        setGroups(json.data.groups ?? []);
      } else {
        setResults([]);
        setGroups([]);
      }
    } catch {
      setResults([]);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => void runSearch(query), 220);
    return () => window.clearTimeout(timer);
  }, [open, query, runSearch]);

  const executeCommand = useCallback(
    async (command: WorkshopCommand) => {
      if (command.kind === "call" && command.phone) {
        window.location.href = `tel:${command.phone.replace(/\s+/g, "")}`;
        setOpen(false);
        return;
      }

      if (command.kind === "navigate" && command.href) {
        setOpen(false);
        router.push(command.href);
        return;
      }

      if (command.kind === "api" && command.api) {
        setExecuting(true);
        try {
          const res = await adminFetch(command.api.path, {
            method: command.api.method,
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(command.api.body),
          });
          if (!res.ok) {
            const json = (await res.json().catch(() => null)) as { error?: string } | null;
            throw new Error(json?.error ?? "Command failed");
          }
          window.dispatchEvent(new CustomEvent("workshop:job-updated"));
          setOpen(false);
          setQuery("");
        } catch (err) {
          console.error("[command palette]", err);
        } finally {
          setExecuting(false);
        }
      }
    },
    [router]
  );

  const activateRow = useCallback(
    (row: PaletteRow) => {
      if (row.type === "command") {
        void executeCommand(row.command);
        return;
      }
      setOpen(false);
      router.push(row.result.href);
    },
    [executeCommand, router]
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
        return;
      }
      if (!open) return;
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((i) => (rows.length ? (i + 1) % rows.length : 0));
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((i) => (rows.length ? (i - 1 + rows.length) % rows.length : 0));
        return;
      }
      if (event.key === "Enter" && rows[activeIndex] && !executing) {
        event.preventDefault();
        activateRow(rows[activeIndex]);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activateRow, activeIndex, executing, open, rows]);

  if (!open) return null;

  let rowIndex = -1;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center bg-black/70 px-4 pt-[10vh]"
      role="dialog"
      aria-modal
      aria-label="Workshop command palette"
      onClick={() => setOpen(false)}
    >
      <div
        className="premium-card w-full max-w-xl rounded-2xl p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3">
          <Search className="h-4 w-4 text-zinc-500" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Try "mark ready", "call", reg, invoice…'
            className="min-h-12 flex-1 bg-transparent text-sm text-white outline-none"
            disabled={executing}
          />
          {(loading || executing) && (
            <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
          )}
        </div>

        {activeJob ? (
          <p className="mt-2 text-[11px] text-zinc-500">
            Active job:{" "}
            <span className="font-mono text-[#e8d5a3]">{activeJob.registration}</span> ·{" "}
            {activeJob.service}
          </p>
        ) : (
          <p className="mt-2 text-[11px] text-zinc-500">
            Select a job in cockpit for mark ready / call / log actions.
          </p>
        )}

        <ul className="mt-3 max-h-[52vh] space-y-1 overflow-y-auto">
          {commands.length > 0 && (
            <li className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
              Commands
            </li>
          )}
          {commands.map((command) => {
            rowIndex += 1;
            const idx = rowIndex;
            const active = idx === activeIndex;
            const isApi = command.kind === "api";
            return (
              <li key={command.id}>
                <button
                  type="button"
                  disabled={executing}
                  className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left disabled:opacity-50 ${
                    active
                      ? "bg-[#d4a63c]/15 ring-1 ring-[#d4a63c]/30"
                      : "hover:bg-white/[0.06]"
                  }`}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => void executeCommand(command)}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded ${
                      isApi ? "bg-amber-500/15 text-amber-200" : "bg-cyan/10 text-cyan"
                    }`}
                  >
                    <Zap className="h-3 w-3" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm text-zinc-100">{command.label}</span>
                    {command.subtitle && (
                      <span className="block text-xs text-zinc-500">{command.subtitle}</span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}

          {!loading &&
            groups.length > 0 &&
            groups.map((group) => (
              <li key={group.kind} className="contents">
                <ul className="contents">
                  <li className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                    {group.label}
                  </li>
                  {group.results.map((row) => {
                    rowIndex += 1;
                    const idx = rowIndex;
                    return (
                      <ResultRow
                        key={`${row.kind}-${row.id}`}
                        row={row}
                        active={idx === activeIndex}
                        onHover={() => setActiveIndex(idx)}
                        onActivate={() =>
                          activateRow({ type: "result", result: row })
                        }
                      />
                    );
                  })}
                </ul>
              </li>
            ))}

          {!loading && groups.length === 0 && (loading || results.length > 0) && (
            <li className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
              Search results
            </li>
          )}

          {!loading &&
            groups.length === 0 &&
            results.map((row) => {
              rowIndex += 1;
              const idx = rowIndex;
              return (
                <ResultRow
                  key={`${row.kind}-${row.id}`}
                  row={row}
                  active={idx === activeIndex}
                  onHover={() => setActiveIndex(idx)}
                  onActivate={() => activateRow({ type: "result", result: row })}
                />
              );
            })}
        </ul>
      </div>
    </div>
  );
}
