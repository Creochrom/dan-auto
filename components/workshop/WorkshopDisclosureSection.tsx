"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

type Props = {
  title: string;
  subtitle?: string;
  countLabel?: string;
  defaultOpen?: boolean;
  open?: boolean;
  onToggle?: (open: boolean) => void;
  className?: string;
  children: ReactNode;
};

export function WorkshopDisclosureSection({
  title,
  subtitle,
  countLabel,
  defaultOpen = false,
  open,
  onToggle,
  className = "",
  children,
}: Props) {
  return (
    <details
      open={open ?? defaultOpen}
      onToggle={(event) => onToggle?.((event.currentTarget as HTMLDetailsElement).open)}
      className={`group rounded-xl border border-white/[0.08] bg-black/20 ${className}`}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 [&::-webkit-details-marker]:hidden">
        <div>
          <p className="text-xs font-semibold text-zinc-200">{title}</p>
          {subtitle ? <p className="mt-0.5 text-[11px] text-zinc-500">{subtitle}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          {countLabel ? (
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-zinc-400">
              {countLabel}
            </span>
          ) : null}
          <ChevronDown className="h-4 w-4 text-zinc-500 transition group-open:rotate-180" aria-hidden />
        </div>
      </summary>
      <div className="border-t border-white/[0.06] px-3 py-3">{children}</div>
    </details>
  );
}
