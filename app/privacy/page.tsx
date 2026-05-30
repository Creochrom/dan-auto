import type { Metadata } from "next";
import { BRAND } from "@/lib/config";
import { PrivacyPolicyNav } from "@/components/compliance/PrivacyPolicyNav";
import { PrivacyPolicyContent } from "@/components/compliance/PrivacyPolicyContent";

export const metadata: Metadata = {
  title: `Privacy Policy | ${BRAND.shortName}`,
  description: `How ${BRAND.shortName} collects and uses personal data for bookings, AI advisor enquiries, repairs, and customer support.`,
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <>
      <PrivacyPolicyNav />
      <main className="section-deep min-h-screen py-10 sm:py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <PrivacyPolicyContent />
        </div>
      </main>
    </>
  );
}
