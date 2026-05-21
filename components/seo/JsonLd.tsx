import { businessConfig } from "@/lib/config/business";

export function JsonLd() {
  const localBusiness = {
    "@context": "https://schema.org",
    "@type": ["AutoRepair", "AutomotiveBusiness", "LocalBusiness"],
    name: businessConfig.name,
    description:
      "Premium MOT, servicing, diagnostics, and repairs in Southampton—dealer-level equipment with independent workshop care.",
    image: `https://danautocentre.co.uk/og-image.jpg`,
    telephone: `+${businessConfig.phone.mobileE164}`,
    email: businessConfig.email,
    url: "https://danautocentre.co.uk",
    address: {
      "@type": "PostalAddress",
      streetAddress: "9 Park Rd",
      addressLocality: "Southampton",
      postalCode: "SO15 3AS",
      addressCountry: "GB",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 50.9104121,
      longitude: -1.4224711,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "08:00",
        closes: "17:00",
      },
    ],
    priceRange: "££",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: businessConfig.googleRating,
      reviewCount: businessConfig.googleReviewCount,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }}
    />
  );
}
