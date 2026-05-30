import { BRAND, BUSINESS, openingHours } from "@/lib/config";

const LAST_UPDATED = "28 May 2026";

type Props = {
  onClose?: () => void;
};

export function PrivacyPolicyContent({ onClose }: Props = {}) {
  const body = (
    <>
      <p className="eyebrow">Privacy Policy</p>
      <h1
        id="privacy-policy-title"
        className="mt-3 text-3xl font-light tracking-tight text-white sm:text-4xl"
      >
        Privacy at {BRAND.shortName}
      </h1>
      <p className="mt-4 text-sm text-zinc-400">Last updated: {LAST_UPDATED}</p>
      <p className="mt-5 text-sm leading-relaxed text-zinc-300 sm:text-base">
        This policy explains what personal data we collect, why we collect it, and how we
        protect it when you contact {BRAND.legalName} for MOT, servicing, diagnostics, or
        repairs — including when you use our online AI Service Advisor.
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-zinc-300 sm:text-base">
        <section>
          <h2 className="text-lg font-medium text-white">1. Data we collect</h2>
          <p className="mt-2">
            We may collect your name, phone number, email address, vehicle registration
            number, vehicle details, booking preferences, and your message or fault
            description.
          </p>
          <p className="mt-2">
            If you interact with our AI Service Advisor, we may store conversation history,
            uploaded files, vehicle-related information, and workshop notes associated with
            your enquiry so our team can review your request and follow up with you.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-white">2. How we use your data</h2>
          <p className="mt-2">We use your information to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-400">
            <li>respond to enquiries and provide quotes;</li>
            <li>provide assistance through the AI Service Advisor;</li>
            <li>review vehicle-related enquiries and uploaded files;</li>
            <li>prepare estimates, diagnostics, callbacks and workshop bookings;</li>
            <li>book and manage MOT, servicing, and repair appointments;</li>
            <li>contact you about your booking or vehicle work;</li>
            <li>keep basic workshop records for customer service and job history.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-medium text-white">3. Legal basis</h2>
          <p className="mt-2">
            We process personal data to provide requested services, to take steps before
            entering a service agreement, and for legitimate interests in running our
            workshop operations and customer support.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-white">4. Sharing your data</h2>
          <p className="mt-2">
            We do not sell your personal data. We only share data with service providers
            needed to run our website and communications (for example, hosting or email
            delivery), and only where necessary.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-white">5. Data security</h2>
          <p className="mt-2">
            We take reasonable technical and organisational measures to protect personal
            data against unauthorised access, misuse, loss, alteration, or disclosure.
            Access to customer information is limited to authorised personnel and trusted
            service providers where required.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-white">6. Cookies</h2>
          <p className="mt-2">
            Our website uses cookies and similar technologies to improve functionality,
            remember preferences, analyse website performance, and support customer
            enquiries. You can manage your cookie preferences through our cookie consent
            settings on the website.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-white">7. Data retention</h2>
          <p className="mt-2">
            We keep enquiry, lead, and booking information only as long as needed for
            workshop operations, customer support, and legal obligations. We periodically
            review stored records and remove data that is no longer required.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-white">8. Your rights</h2>
          <p className="mt-2">
            Under UK data protection law, you may request access to your data, correction
            of inaccurate details, deletion where appropriate, or restriction of
            processing. You can contact us using the details below and we will respond as
            quickly as practical.
          </p>
          <p className="mt-2">
            If you are unhappy with how your data has been handled, you may also contact
            the Information Commissioner&apos;s Office (ICO) for further guidance.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-medium text-white">9. Contact us</h2>
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
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="mt-8 min-h-11 w-full rounded-full border border-white/12 px-5 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-[#d4a63c]/35 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4a63c]"
        >
          Close
        </button>
      ) : null}
    </>
  );

  if (onClose) {
    return <div className="px-5 pb-6 pt-12 sm:px-7 sm:pb-8">{body}</div>;
  }

  return <div className="premium-panel rounded-3xl p-6 sm:p-10">{body}</div>;
}
