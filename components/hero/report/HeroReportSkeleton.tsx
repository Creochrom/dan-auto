"use client";

export function HeroReportSkeleton() {
  return (
    <div className="hero-report-skeleton w-[280px] animate-pulse rounded-[20px] border border-[#d4a63c]/18 bg-[#080706]/85 p-4 backdrop-blur-xl">
      <div className="h-3 w-28 rounded bg-white/10" />
      <div className="mt-3 h-20 w-full rounded-lg bg-white/8" />
      <div className="mt-3 h-4 w-3/4 rounded bg-white/10" />
      <div className="mt-2 h-3 w-1/2 rounded bg-white/8" />
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="h-10 rounded-lg bg-white/8" />
        <div className="h-10 rounded-lg bg-white/8" />
      </div>
      <div className="mt-4 h-9 w-full rounded-xl bg-[#d4a63c]/15" />
    </div>
  );
}
