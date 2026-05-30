import Link from "next/link";
import { AdminQuickLinks } from "@/components/enterprise/AdminQuickLinks";
import { ADMIN_DOCS } from "@/lib/admin/docs-catalog";

export default function AdminDocsPage() {
  const operations = ADMIN_DOCS.filter((doc) => doc.group === "operations");
  const productBrain = ADMIN_DOCS.filter((doc) => doc.group === "product-brain");
  const total = ADMIN_DOCS.length;

  return (
    <main className="admin-content-wrap max-w-6xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Docs Center</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Full documentation index for current functionality, setup, architecture, and operating playbooks.
          </p>
          <p className="mt-2 text-xs text-zinc-600">
            Each document includes a clear title and short description for quick scanning.
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-zinc-400">
          {total} documents
        </span>
      </div>

      <AdminQuickLinks active="workshop-assistant" />

      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Operations
          </h2>
          <span className="text-xs text-zinc-600">{operations.length} docs</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {operations.map((doc) => (
            <Link
              key={doc.slug}
              href={`/admin/docs/${doc.slug}`}
              className="premium-card rounded-2xl border border-white/[0.08] p-4 transition hover:border-[#d4a63c]/35"
            >
              <p className="font-semibold text-white">{doc.title}</p>
              <p className="mt-1 text-sm text-zinc-500">{doc.description}</p>
              <p className="mt-3 text-xs text-[#d4a63c]">Open doc →</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Product Brain
          </h2>
          <span className="text-xs text-zinc-600">{productBrain.length} docs</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {productBrain.map((doc) => (
            <Link
              key={doc.slug}
              href={`/admin/docs/${doc.slug}`}
              className="premium-card rounded-2xl border border-white/[0.08] p-4 transition hover:border-cyan/35"
            >
              <p className="font-semibold text-white">{doc.title}</p>
              <p className="mt-1 text-sm text-zinc-500">{doc.description}</p>
              <p className="mt-3 text-xs text-cyan">Open doc →</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
