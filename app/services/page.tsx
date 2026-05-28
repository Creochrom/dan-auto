import type { Metadata } from "next";
import Link from "next/link";
import { SERVICE_LANDINGS } from "@/lib/service-landings";

export const metadata: Metadata = {
  title: "Service Guides Southampton",
  description:
    "Local service guides for Southampton drivers: BMW diagnostics, MOT prep, DPF issues, and timing chain checks.",
  alternates: {
    canonical: "/services",
  },
};

export default function ServicesLandingIndexPage() {
  return (
    <main className="section-deep min-h-screen py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <p className="eyebrow">Service landing pages</p>
        <h1 className="mt-3 text-3xl font-light tracking-tight text-white sm:text-5xl">
          Local service guides for UK drivers
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-zinc-300 sm:text-lg">
          Practical pages for common workshop concerns in and around Southampton.
          Use these to understand symptoms, likely checks, and when to book an
          inspection.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {SERVICE_LANDINGS.map((entry) => (
            <Link
              key={entry.slug}
              href={`/services/${entry.slug}`}
              className="premium-card rounded-2xl p-6 transition hover:border-cyan/35"
            >
              <h2 className="text-xl font-medium text-white">{entry.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                {entry.metaDescription}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-10">
          <Link
            href="/#services"
            className="inline-flex items-center gap-2 rounded-full border border-[#d4a63c]/35 bg-[#d4a63c]/10 px-6 py-3 text-sm font-semibold text-[#e8d5a3] transition hover:border-[#d4a63c]/55"
          >
            Back to main services
          </Link>
        </div>
      </div>
    </main>
  );
}
