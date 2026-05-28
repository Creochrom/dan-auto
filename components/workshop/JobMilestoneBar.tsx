"use client";

import { Loader2 } from "lucide-react";
import {
  WORKSHOP_MILESTONE_IDS,
  WORKSHOP_MILESTONES,
  type WorkshopMilestoneId,
} from "@/lib/workshop/job-milestones";

type Props = {
  disabled?: boolean;
  loadingId?: WorkshopMilestoneId | null;
  onMilestone: (id: WorkshopMilestoneId) => void;
};

export function JobMilestoneBar({ disabled, loadingId, onMilestone }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {WORKSHOP_MILESTONE_IDS.map((id) => {
        const def = WORKSHOP_MILESTONES[id];
        const loading = loadingId === id;
        return (
          <button
            key={id}
            type="button"
            disabled={disabled || loading}
            onClick={() => onMilestone(id)}
            className="min-h-10 rounded-full border border-white/12 bg-white/[0.04] px-3 text-[11px] font-medium text-zinc-200 hover:border-[#d4a63c]/35 hover:bg-[#d4a63c]/10 disabled:opacity-45"
          >
            {loading ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                {def.shortLabel}
              </span>
            ) : (
              def.shortLabel
            )}
          </button>
        );
      })}
    </div>
  );
}
