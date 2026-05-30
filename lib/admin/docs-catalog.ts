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
    slug: "workshop-go-live",
    title: "Workshop Go-Live Checklist",
    description:
      "Production-ready launch checklist for migrations, env vars, health checks, and workshop handover.",
    filePath: path.join(ROOT, "docs", "WORKSHOP_GO_LIVE.md"),
    group: "operations",
  },
  {
    slug: "admin-login-smoke",
    title: "Admin Login Smoke Test",
    description:
      "Fast 5-minute verification for admin login, session cookies, and secure auth setup.",
    filePath: path.join(ROOT, "docs", "ADMIN_LOGIN_SMOKE.md"),
    group: "operations",
  },
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
    slug: "data-model",
    title: "Data Model",
    description: "Workshop entities, relationships, and persistence model across jobs, bookings, and leads.",
    filePath: path.join(ROOT, "project-brain", "DATA_MODEL.md"),
    group: "product-brain",
  },
  {
    slug: "product-doctrine",
    title: "Product Doctrine",
    description: "Core product principles and UX decision framework for workshop operations.",
    filePath: path.join(ROOT, "project-brain", "PRODUCT_DOCTRINE.md"),
    group: "product-brain",
  },
  {
    slug: "inspiration-board",
    title: "Inspiration Board",
    description: "Design and product references that guide visual direction and user-flow quality.",
    filePath: path.join(ROOT, "project-brain", "INSPIRATION_BOARD.md"),
    group: "product-brain",
  },
  {
    slug: "hero-architecture",
    title: "Hero Architecture",
    description: "Technical breakdown of Hero layout, layering, overflow, and responsive interaction behavior.",
    filePath: path.join(ROOT, "docs", "HERO_ARCHITECTURE.md"),
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
