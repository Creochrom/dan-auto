"use client";

import { useState } from "react";
import { Search } from "lucide-react";

type UKPlateInputProps = {
  value: string;
  onChange: (value: string) => void;
  onLookup?: (plate: string) => void;
  className?: string;
};

function formatUKPlate(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8);
}

export function UKPlateInput({
  value,
  onChange,
  onLookup,
  className = "",
}: UKPlateInputProps) {
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.length >= 2) onLookup?.(value);
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div
        className={`flex overflow-hidden rounded-lg border-2 transition-all duration-300 ${
          focused
            ? "border-amber-500/70 shadow-[0_0_30px_rgba(201,162,39,0.3)]"
            : "border-black/20"
        }`}
      >
        <div className="flex flex-col items-center justify-center bg-[#003399] px-2 py-3 text-white sm:px-3">
          <span className="text-[10px] font-bold leading-none sm:text-xs">GB</span>
          <span className="mt-0.5 text-[8px] opacity-80 sm:text-[9px]">UK</span>
        </div>
        <input
          type="text"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          placeholder="AB12 CDE"
          value={value}
          onChange={(e) => onChange(formatUKPlate(e.target.value))}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="plate-input min-w-0 flex-1 bg-[#F9D71C] px-3 py-3 text-lg font-bold uppercase text-black placeholder:text-black/35 focus:outline-none sm:px-4 sm:text-2xl"
          aria-label="UK vehicle registration"
        />
        <button
          type="submit"
          className="flex items-center gap-1 bg-black px-3 text-white transition hover:bg-zinc-800 sm:px-4"
        >
          <Search className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="hidden text-sm font-medium sm:inline">Look up</span>
        </button>
      </div>
    </form>
  );
}
