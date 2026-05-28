import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServiceLandingTemplate } from "@/components/services/ServiceLandingTemplate";
import {
  SERVICE_LANDINGS,
  getServiceLanding,
  type ServiceLandingSlug,
} from "@/lib/service-landings";

type Props = {
  params: Promise<{ slug: string }>;
};

function isServiceSlug(value: string): value is ServiceLandingSlug {
  return SERVICE_LANDINGS.some((entry) => entry.slug === value);
}

export async function generateStaticParams() {
  return SERVICE_LANDINGS.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!isServiceSlug(slug)) {
    return {};
  }

  const page = getServiceLanding(slug);
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: {
      canonical: `/services/${page.slug}`,
    },
    openGraph: {
      title: `${page.metaTitle} | Dan Auto Centre`,
      description: page.metaDescription,
      url: `/services/${page.slug}`,
      locale: "en_GB",
      type: "website",
    },
  };
}

export default async function ServiceLandingPage({ params }: Props) {
  const { slug } = await params;
  if (!isServiceSlug(slug)) {
    notFound();
  }

  const page = getServiceLanding(slug);
  return <ServiceLandingTemplate page={page} />;
}
