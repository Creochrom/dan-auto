import { promises as fs } from "node:fs";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminDocBySlug } from "@/lib/admin/docs-catalog";

type Params = { slug: string };

export default async function AdminDocDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const doc = getAdminDocBySlug(slug);
  if (!doc) notFound();

  let content = "";
  try {
    content = await fs.readFile(doc.filePath, "utf8");
  } catch {
    content = "Document is currently unavailable.";
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
            Docs Center
          </p>
          <h1 className="mt-1 text-xl font-semibold text-white">{doc.title}</h1>
          <p className="mt-1 text-sm text-zinc-500">{doc.description}</p>
        </div>
        <Link href="/admin/docs" className="text-sm text-[#d4a63c] hover:underline">
          ← Back to docs
        </Link>
      </div>

      <article className="premium-card rounded-2xl border border-white/[0.08] bg-black/30 p-4">
        <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap break-words text-xs leading-6 text-zinc-200">
          {content}
        </pre>
      </article>
    </main>
  );
}
