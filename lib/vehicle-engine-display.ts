/**
 * Canonical helpers for DVLA-sourced engine labels.
 * Do not infer or rewrite displacement elsewhere — use these functions only.
 */

/** Format cc → litres label, e.g. 1398 → "1.4L". */
export function formatEngineDisplacementLitres(engineCapacityCc: number): string {
  const litres = (engineCapacityCc / 1000).toFixed(1);
  return `${litres}L`;
}

/** Full engine line from DVLA capacity + fuel, e.g. "1.4L Petrol". */
export function engineLabelFromCapacity(
  engineCapacityCc: number,
  fuelType: string
): string {
  const litres = formatEngineDisplacementLitres(engineCapacityCc);
  const fuel = fuelType !== "Unknown" ? fuelType : "Engine";
  return `${litres} ${fuel}`;
}

/**
 * Extract the displacement token from a DVLA engine string.
 * Handles "1.4L Petrol", "1.4 L Petrol", and "4.0L Diesel".
 */
export function extractEngineDisplacement(engineLabel: string): string | undefined {
  const trimmed = engineLabel.trim();
  if (!trimmed) return undefined;
  const match = trimmed.match(/([\d.]+)\s*L\b/i);
  if (!match) return undefined;
  return `${match[1]}L`;
}
