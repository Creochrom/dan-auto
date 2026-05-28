/**
 * Prototype demo data — not loaded in production admin.
 * Kept for local UI experiments only.
 */

import type { EnterpriseStore } from "./types";

export const DEMO_ENTERPRISE: EnterpriseStore = {
  jobs: [
    {
      id: "job-1",
      reg: "HV14 KPL",
      customerName: "James T.",
      service: "Clutch replacement",
      status: "in_progress",
      assignedTo: "tech-1",
      labour: 420,
      parts: 380,
      notes: "Dual mass flywheel check complete.",
      media: [],
      vip: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: "job-2",
      reg: "BD20 AU1",
      customerName: "Sarah M.",
      service: "Diagnostics · Audi Q7",
      status: "awaiting_approval",
      assignedTo: "tech-2",
      labour: 89,
      parts: 0,
      notes: "EGR fault confirmed — quote sent.",
      media: [{ type: "image", url: "#", caption: "Fault code screenshot" }],
      vip: true,
      createdAt: new Date().toISOString(),
    },
  ],
  quotes: [
    {
      id: "q-1",
      jobId: "job-2",
      reg: "BD20 AU1",
      total: 1240,
      status: "pending",
      createdAt: new Date().toISOString(),
    },
  ],
  staff: [
    { id: "tech-1", name: "Daniel", role: "technician", active: true },
    { id: "tech-2", name: "Mike", role: "technician", active: true },
    { id: "sa-1", name: "Reception", role: "service_advisor", active: true },
  ],
  bugs: [],
};
