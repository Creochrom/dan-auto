import type { Metadata } from "next";
import { BRAND, BUSINESS, openingHours } from "@/lib/config";

export const metadata: Metadata = {
  title: `Privacy Policy | ${BRAND.shortName}`,
  description: `How ${BRAND.shortName} collects and uses personal data for bookings, repairs, and customer support.`,
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "28 May 2026";

export default function PrivacyPage() {
  return (
    <main className="section-deep min-h-screen py-16 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="premium-panel rounded-3xl p-6 sm:p-10">
          <p className="eyebrow">Privacy Policy</p>
          <h1 className="mt-3 text-3xl font-light tracking-tight text-white sm:text-4xl">
            Privacy at {BRAND.shortName}
          </h1>
          <p className="mt-4 text-sm text-zinc-400">Last updated: {LAST_UPDATED}</p>
          <p className="mt-5 text-sm leading-relaxed text-zinc-300 sm:text-base">
            This policy explains what personal data we collect, why we collect it, and
            how we protect it when you contact {BRAND.legalName} for MOT, servicing,
            diagnostics, or repairs.
          </p>

          <div className="mt-8 space-y-6 text-sm leading-relaxed text-zinc-300 sm:text-base">
            <section>
              <h2 className="text-lg font-medium text-white">1. Data we collect</h2>
              <p className="mt-2">
                We may collect your name, phone number, email address, vehicle
                registration number, vehicle details, booking preferences, and your
                message or fault description. If you use our advisor or upload media,
                we may also store related chat notes and uploaded files so our workshop
                team can review your request.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-white">2. How we use your data</h2>
              <p className="mt-2">We use your information to:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-400">
                <li>respond to enquiries and provide quotes;</li>
                <li>book and manage MOT, servicing, and repair appointments;</li>
                <li>contact you about your booking or vehicle work;</li>
                <li>keep basic workshop records for customer service and job history.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-medium text-white">3. Legal basis</h2>
              <p className="mt-2">
                We process personal data to provide requested services, to take steps
                before entering a service agreement, and for legitimate interests in
                running our workshop operations and customer support.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-white">4. Sharing your data</h2>
              <p className="mt-2">
                We do not sell your personal data. We only share data with service
                providers needed to run our website and communications (for example,
                hosting or email delivery), and only where necessary.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-white">5. Data retention</h2>
              <p className="mt-2">
                We keep enquiry, lead, and booking information only as long as needed
                for workshop operations, customer support, and legal obligations. We
                periodically review stored records and remove data that is no longer
                required.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-white">6. Your rights</h2>
              <p className="mt-2">
                Under UK data protection law, you may request access to your data,
                correction of inaccurate details, deletion where appropriate, or
                restriction of processing. You can contact us using the details below
                and we will respond as quickly as practical.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-white">7. Contact us</h2>
              <p className="mt-2">
                Data controller: <span className="text-white">{BRAND.legalName}</span>
              </p>
              <p className="mt-1">
                Email:{" "}
                <a className="text-cyan hover:underline" href={`mailto:${BUSINESS.email}`}>
                  {BUSINESS.email}
                </a>
              </p>
              <p className="mt-1">
                Phone:{" "}
                <a className="text-cyan hover:underline" href={BUSINESS.phoneHref}>
                  {BUSINESS.phone}
                </a>
              </p>
              <p className="mt-1">Address: {BUSINESS.address}</p>
              <p className="mt-1 text-zinc-400">
                Workshop hours: {openingHours.summary} ({openingHours.detail})
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
