import type { EnterpriseStore } from "./types";

/** Default store — no demo jobs, quotes, or staff. */
export const EMPTY_ENTERPRISE: EnterpriseStore = {
  jobs: [],
  quotes: [],
  staff: [],
  bugs: [],
};

/** @deprecated Use EMPTY_ENTERPRISE — demo data moved to seed.demo.ts */
export const SEED_ENTERPRISE = EMPTY_ENTERPRISE;
