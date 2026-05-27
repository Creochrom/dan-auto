"use client";

import { AdvisorQuickStartGrid } from "@/features/chat/components/AdvisorQuickStartGrid";
import type { QuickStartAction } from "@/lib/config/advisor-copy";

type Props = {
  title: string;
  body: string;
  prompt: string;
  actions: QuickStartAction[];
  selectedActionId?: string | null;
  onSelectAction: (action: QuickStartAction) => void;
  disabled?: boolean;
};

/** Static workshop-terminal opening — not an AI-generated greeting. */
export function AdvisorWorkshopIntro({
  title,
  body,
  prompt,
  actions,
  selectedActionId,
  onSelectAction,
  disabled,
}: Props) {
  return (
    <div className="advisor-workshop-intro">
      <p className="advisor-workshop-intro__eyebrow">Workshop intake</p>
      <h3 className="advisor-workshop-intro__title">{title}</h3>
      <p className="advisor-workshop-intro__body">{body}</p>
      <p className="advisor-workshop-intro__prompt">{prompt}</p>
      <AdvisorQuickStartGrid
        actions={actions}
        selectedId={selectedActionId}
        onSelect={onSelectAction}
        disabled={disabled}
      />
    </div>
  );
}
