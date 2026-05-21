"use client";

const STEPS = ["schedule", "intake", "confirm"] as const;

type Step = (typeof STEPS)[number];

const LABELS: Record<Step, string> = {
  schedule: "Slot",
  intake: "Vehicle",
  confirm: "Send",
};

type Props = {
  current: Step;
};

export function IntakeProgressBar({ current }: Props) {
  const idx = STEPS.indexOf(current);
  return (
    <div className="flex items-center gap-2" aria-label="Booking progress">
      {STEPS.map((step, i) => {
        const active = i <= idx;
        const currentStep = i === idx;
        return (
          <div key={step} className="flex flex-1 items-center gap-2">
            <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition ${
                  currentStep
                    ? "bg-[#d4a63c] text-black ring-2 ring-[#d4a63c]/40"
                    : active
                      ? "bg-[#d4a63c]/25 text-[#f5e6b8]"
                      : "bg-white/5 text-zinc-600"
                }`}
              >
                {i + 1}
              </span>
              <span
                className={`text-[9px] font-semibold uppercase tracking-wider ${
                  currentStep ? "text-[#d4a63c]" : "text-zinc-600"
                }`}
              >
                {LABELS[step]}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mb-4 h-px flex-1 max-w-[40px] ${active ? "bg-[#d4a63c]/35" : "bg-white/8"}`}
                aria-hidden
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
