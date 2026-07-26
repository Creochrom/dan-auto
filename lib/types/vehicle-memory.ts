/**
 * Persistent vehicle + customer memory keyed by canonical registration.
 *
 * Lightweight by design — no CRM-style schema, just enough to make
 * returning visits feel familiar to the AI advisor.
 */

export type VehicleMemoryFacts = {
  make: string;
  model: string;
  year: string;
  fuel: string;
  engine: string;
  /** Optional richer detail from DVLA / MOT enrichments. */
  motStatus?: string;
  /** ISO date from DVLA when available. */
  motExpiryDate?: string;
  taxStatus?: string;
  /** DVSA MOT summary for AI advisor (from last lookup). */
  motHealthSummary?: string[];
  lastMotResult?: string;
  lastMotAdvisoryCount?: number;
  recurringMotThemes?: string[];
};

export type VehicleMemoryCustomer = {
  name: string;
  phone: string;
  email: string;
  /** ISO timestamp of last contact. */
  lastSeenAt: string;
};

export type VehicleMemoryIntake = {
  /** ISO timestamp the intake was emailed. */
  at: string;
  /** Short workshop-facing summary (the AI summary line). */
  summary: string;
  /** Symptoms list as captured in the structured intake. */
  symptoms: string[];
  /** Severity / urgency snapshot. */
  urgency: string;
  /** Whether a callback was requested. */
  callbackRequested: boolean;
  /** chatSession id that produced this intake — for audit trail. */
  chatSessionId: string;
};

export type VehicleMemoryRecord = {
  /** Canonical (no-space, upper-case) registration. */
  reg: string;
  /** Display-formatted registration (with space). */
  regDisplay: string;
  vehicle: VehicleMemoryFacts;
  customer: VehicleMemoryCustomer;
  intakes: VehicleMemoryIntake[];
  firstSeenAt: string;
  lastSeenAt: string;
};

/** What the chat service receives back when a registration arrives. */
export type VehicleMemoryLookupResult = {
  /** Canonical reg used for lookup, or undefined when input was invalid. */
  reg?: string;
  regDisplay?: string;
  /** True when a memory record existed before this turn. */
  returning: boolean;
  /** Vehicle facts (from memory if present, else from DVLA). */
  vehicle?: VehicleMemoryFacts;
  /** Known customer (only when returning). */
  customer?: VehicleMemoryCustomer;
  /** Past intakes the AI can reference (newest first, max 3). */
  recentIntakes: VehicleMemoryIntake[];
  /** True when DVLA matched the plate. */
  dvlaMatched: boolean;
};
