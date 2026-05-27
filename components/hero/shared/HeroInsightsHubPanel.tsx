"use client";

import {
  HERO_INSIGHT_CATEGORIES,
  type HeroInsightCategoryId,
} from "@/lib/hero-onboarding";

type Props = {
  selectedCategory: HeroInsightCategoryId | null;
  onSelectCategory: (id: HeroInsightCategoryId) => void;
};

export function HeroInsightsHubPanel({
  selectedCategory,
  onSelectCategory,
}: Props) {
  return (
    <div className="hero-insights-hub-panel px-4 pb-3 pt-2 sm:px-5">
      <p className="text-[11px] leading-snug text-zinc-500">
        Choose a report to open — one at a time.
      </p>

      <div className="mt-3 grid gap-1 sm:grid-cols-2">
        {HERO_INSIGHT_CATEGORIES.map((cat) => {
          const active = selectedCategory === cat.id;
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              type="button"
              aria-pressed={active}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-start gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition-colors duration-200 sm:px-3 ${
                active
                  ? "bg-amber-400/[0.08]"
                  : "hover:bg-white/[0.03]"
              }`}
            >
              <Icon
                className={`mt-0.5 h-4 w-4 shrink-0 ${active ? "text-amber-200" : "text-amber-300/75"}`}
                aria-hidden
              />
              <span className="min-w-0">
                <span
                  className={`block text-[12px] font-semibold sm:text-[13px] ${active ? "text-amber-100" : "text-white"}`}
                >
                  {cat.label}
                </span>
                <span className="mt-0.5 block text-[10px] leading-snug text-zinc-500 sm:text-[11px]">
                  {cat.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
