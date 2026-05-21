/** UK-style display: up to 8 alnum, optional space after fourth character. */
export function formatPlate(raw: string) {
  const cleaned = raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8);
  if (cleaned.length <= 4) return cleaned;
  return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`.trim();
}

/** Canonical registration for lookup / booking (no spaces). */
export function stripPlate(raw: string) {
  return raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8);
}
