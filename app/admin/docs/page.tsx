import Link from "next/link";
import { AdminQuickLinks } from "@/components/enterprise/AdminQuickLinks";
import { ADMIN_DOCS } from "@/lib/admin/docs-catalog";

export default function AdminDocsPage() {
  const operations = ADMIN_DOCS.filter((doc) => doc.group === "operations");
  const productBrain = ADMIN_DOCS.filter((doc) => doc.group === "product-brain");

  return (
    <main className="admin-content-wrap max-w-6xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Docs Center</h1>
          <p className="mt-1 text-sm text-zinc-500">
            One place for workshop operations and product documentation.
          </p>
        </div>
      </div>

      <AdminQuickLinks active="workshop-assistant" />

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500">
          Operations
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {operations.map((doc) => (
            <Link
              key={doc.slug}
              href={`/admin/docs/${doc.slug}`}
              className="premium-card rounded-2xl border border-white/[0.08] p-4 transition hover:border-[#d4a63c]/35"
            >
              <p className="font-semibold text-white">{doc.title}</p>
              <p className="mt-1 text-sm text-zinc-500">{doc.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500">
          Product Brain
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {productBrain.map((doc) => (
            <Link
              key={doc.slug}
              href={`/admin/docs/${doc.slug}`}
              className="premium-card rounded-2xl border border-white/[0.08] p-4 transition hover:border-cyan/35"
            >
              <p className="font-semibold text-white">{doc.title}</p>
              <p className="mt-1 text-sm text-zinc-500">{doc.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
