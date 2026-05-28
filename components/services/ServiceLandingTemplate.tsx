import Link from "next/link";
import { ArrowRight, CheckCircle2, MapPin, Wrench } from "lucide-react";
import { BUSINESS, businessConfig } from "@/lib/config";
import { SERVICE_LANDINGS, type ServiceLanding, type ServiceLandingSlug } from "@/lib/service-landings";

type Props = {
  page: ServiceLanding;
};

function relatedPages(currentSlug: ServiceLandingSlug): ServiceLanding[] {
  return SERVICE_LANDINGS.filter((item) => item.slug !== currentSlug);
}

export function ServiceLandingTemplate({ page }: Props) {
  const related = relatedPages(page.slug);

  return (
    <main className="section-deep min-h-screen">
      <section className="relative border-b border-white/10 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <p className="eyebrow">Local service page · UK</p>
          <h1 className="mt-3 text-3xl font-light tracking-tight text-white sm:text-5xl">
            {page.title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-zinc-300 sm:text-lg">
            {page.intro}
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-zinc-500">
            {page.localIntent}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/#booking"
              className="btn-glow inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-black"
            >
              {page.ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/#diagnostics"
              className="inline-flex items-center gap-2 rounded-full border border-[#d4a63c]/35 bg-[#d4a63c]/10 px-6 py-3 text-sm font-semibold text-[#e8d5a3] transition hover:border-[#d4a63c]/55"
            >
              Ask diagnostics team
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 sm:px-6 lg:grid-cols-2">
          <article className="premium-card rounded-2xl p-6">
            <h2 className="text-xl font-medium text-white">Common symptoms we check</h2>
            <ul className="mt-4 space-y-3">
              {page.symptoms.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-zinc-300">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
                  {item}
                </li>
              ))}
            </ul>
          </article>

          <article className="premium-card rounded-2xl p-6">
            <h2 className="text-xl font-medium text-white">How our workshop approach works</h2>
            <ol className="mt-4 space-y-3">
              {page.process.map((step, idx) => (
                <li key={step} className="flex items-start gap-3 text-sm text-zinc-300">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d4a63c]/15 text-[11px] font-semibold text-[#d4a63c]">
                    {idx + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </article>
        </div>
      </section>

      <section className="py-4 sm:py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <article className="premium-card rounded-2xl p-6">
            <h2 className="text-xl font-medium text-white">Why local drivers choose {BUSINESS.name}</h2>
            <ul className="mt-4 space-y-3">
              {page.whyChooseUs.map((point) => (
                <li key={point} className="flex items-start gap-3 text-sm text-zinc-300">
                  <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-[#d4a63c]" />
                  {point}
                </li>
              ))}
            </ul>
            <p className="mt-5 flex items-start gap-2 text-sm text-zinc-500">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
              {businessConfig.address.line}
            </p>
          </article>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-2xl font-light text-white">Related service pages</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((entry) => (
              <Link
                key={entry.slug}
                href={`/services/${entry.slug}`}
                className="premium-card rounded-2xl p-5 transition hover:border-cyan/35"
              >
                <p className="text-base font-medium text-white">{entry.title}</p>
                <p className="mt-2 text-sm text-zinc-400">{entry.metaDescription}</p>
              </Link>
            ))}
            <Link
              href="/#services"
              className="premium-card rounded-2xl p-5 transition hover:border-cyan/35"
            >
              <p className="text-base font-medium text-white">All workshop services</p>
              <p className="mt-2 text-sm text-zinc-400">
                Return to the main services section for MOT, diagnostics, and repairs.
              </p>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-6 pb-16 sm:py-10 sm:pb-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="text-2xl font-light text-white">FAQ</h2>
          <div className="mt-5 space-y-3">
            {page.faq.map((item) => (
              <article key={item.q} className="premium-card rounded-2xl p-5">
                <h3 className="text-base font-medium text-white">{item.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">{item.a}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
