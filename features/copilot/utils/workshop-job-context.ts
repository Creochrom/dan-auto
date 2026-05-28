/**
 * Workshop job context from URL (?jobId= & ?reg=) until jobs API ships.
 */

export type WorkshopJobContextStub = {
  jobId: string;
  reg?: string;
  /** Human-readable line for UI chips */
  displayLabel: string;
  /** Pre-fill for copilot context field */
  contextLine: string;
  /** Reserved for jobs API — symptoms, notes, mileage */
  symptomSummary?: string;
};

export function parseWorkshopJobParams(searchParams: URLSearchParams): {
  jobId: string | null;
  reg: string | null;
} {
  const jobId = searchParams.get("jobId")?.trim() || null;
  const reg = searchParams.get("reg")?.trim().toUpperCase() || null;
  return { jobId, reg };
}

/** Build stub context from query params (no network). */
export function resolveWorkshopJobContextStub(params: {
  jobId?: string | null;
  reg?: string | null;
}): WorkshopJobContextStub | null {
  const jobId = params.jobId?.trim() || null;
  const reg = params.reg?.trim().toUpperCase() || null;
  if (!jobId && !reg) return null;

  const id = jobId ?? `stub-${reg ?? "unknown"}`;
  const displayLabel = reg
    ? jobId
      ? `${reg} · Job ${shortJobId(jobId)}`
      : reg
    : `Job ${shortJobId(id)}`;

  const contextParts = [
    reg ? `Registration: ${reg}` : null,
    jobId ? `Job ID: ${jobId}` : null,
    "(Full job record will load when jobs API is connected.)",
  ].filter(Boolean);

  return {
    jobId: id,
    reg: reg ?? undefined,
    displayLabel,
    contextLine: contextParts.join(" · "),
    symptomSummary: undefined,
  };
}

function shortJobId(id: string): string {
  return id.length > 12 ? `${id.slice(0, 8)}…` : id;
}
