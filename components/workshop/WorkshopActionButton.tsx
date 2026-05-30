type WorkshopActionVariant =
  | "call"
  | "primary"
  | "vehicle"
  | "neutral"
  | "gold"
  | "outline";

const VARIANT_CLASS: Record<WorkshopActionVariant, string> = {
  call: "border-emerald-400/35 bg-emerald-500/10 text-emerald-200 hover:border-emerald-400/55 hover:bg-emerald-500/15",
  primary:
    "border-[#d4a63c]/35 bg-[#d4a63c]/10 text-[#e8d5a3] hover:border-[#d4a63c]/55 hover:bg-[#d4a63c]/15",
  vehicle: "border-cyan/30 bg-cyan/10 text-cyan hover:border-cyan/45 hover:bg-cyan/15",
  neutral:
    "border-white/[0.08] bg-white/[0.02] text-zinc-300 hover:border-white/15 hover:bg-white/[0.05] hover:text-white",
  gold: "bg-[#d4a63c] text-black hover:bg-[#dfaf4a]",
  outline:
    "border-white/15 bg-white/[0.04] text-zinc-200 hover:border-white/25 hover:text-white",
};

export function workshopActionButtonClass(variant: WorkshopActionVariant): string {
  return `inline-flex min-h-10 items-center justify-center rounded-full border px-3 py-2 text-xs font-semibold transition ${VARIANT_CLASS[variant]}`;
}
