export type JobStatus =
  | "queued"
  | "claimed"
  | "in_progress"
  | "awaiting_parts"
  | "awaiting_approval"
  | "completed";

export type QuoteStatus = "pending" | "accepted" | "rejected" | "counter" | "installments";

export type WorkshopJob = {
  id: string;
  reg: string;
  customerName: string;
  service: string;
  status: JobStatus;
  assignedTo?: string;
  labour: number;
  parts: number;
  notes: string;
  media: { type: "image" | "video"; url: string; caption: string }[];
  vip: boolean;
  createdAt: string;
};

export type RepairQuote = {
  id: string;
  jobId: string;
  reg: string;
  total: number;
  status: QuoteStatus;
  customerMessage?: string;
  createdAt: string;
};

export type StaffMember = {
  id: string;
  name: string;
  role: "technician" | "service_advisor";
  active: boolean;
};

export type BugReport = {
  id: string;
  from: string;
  title: string;
  body: string;
  status: "open" | "in_progress" | "resolved";
  createdAt: string;
};

export type EnterpriseStore = {
  jobs: WorkshopJob[];
  quotes: RepairQuote[];
  staff: StaffMember[];
  bugs: BugReport[];
};
