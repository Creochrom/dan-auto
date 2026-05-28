import path from "node:path";

export type AdminDocEntry = {
  slug: string;
  title: string;
  description: string;
  filePath: string;
  group: "operations" | "product-brain";
};

const ROOT = process.cwd();

export const ADMIN_DOCS: AdminDocEntry[] = [
  {
    slug: "workshop-ecosystem",
    title: "Workshop Ecosystem",
    description: "Core workshop operating model and build priorities.",
    filePath: path.join(ROOT, "project-brain", "WORKSHOP_ECOSYSTEM.md"),
    group: "product-brain",
  },
  {
    slug: "project-brain",
    title: "Project Brain",
    description: "Canonical product context, goals, and system map.",
    filePath: path.join(ROOT, "project-brain", "PROJECT_BRAIN.md"),
    group: "product-brain",
  },
  {
    slug: "roadmap",
    title: "Roadmap",
    description: "Delivery phases, milestones, and ownership.",
    filePath: path.join(ROOT, "project-brain", "ROADMAP.md"),
    group: "product-brain",
  },
  {
    slug: "decisions-log",
    title: "Decisions Log",
    description: "Architectural and product decisions with rationale.",
    filePath: path.join(ROOT, "project-brain", "DECISIONS_LOG.md"),
    group: "product-brain",
  },
  {
    slug: "anythingllm-setup",
    title: "AnythingLLM Setup",
    description: "Knowledge-base ingestion and retrieval setup guide.",
    filePath: path.join(ROOT, "docs", "ANYTHINGLLM_SETUP.md"),
    group: "operations",
  },
  {
    slug: "supabase-go-live",
    title: "Supabase Go Live",
    description: "Database rollout, env, and smoke-test checks.",
    filePath: path.join(ROOT, "docs", "SUPABASE_GO_LIVE.md"),
    group: "operations",
  },
  {
    slug: "admin-auth",
    title: "Admin Auth Setup",
    description: "Admin login credentials and session configuration.",
    filePath: path.join(ROOT, "docs", "ADMIN_AUTH.md"),
    group: "operations",
  },
  {
    slug: "gemini-setup",
    title: "Gemini Setup",
    description: "Gemini API setup for advisor and workshop copilot.",
    filePath: path.join(ROOT, "docs", "GEMINI_SETUP.md"),
    group: "operations",
  },
  {
    slug: "email-setup",
    title: "Email Setup",
    description: "Workshop email delivery and provider configuration.",
    filePath: path.join(ROOT, "docs", "EMAIL_SETUP.md"),
    group: "operations",
  },
];

export function getAdminDocBySlug(slug: string): AdminDocEntry | undefined {
  return ADMIN_DOCS.find((doc) => doc.slug === slug);
}
