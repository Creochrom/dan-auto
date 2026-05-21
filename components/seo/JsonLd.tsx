const BUSINESS = {
  name: "Dan Auto Centre LTD",
  phone: "+442380233552",
  email: "contact@danautocentre.co.uk",
  address: {
    streetAddress: "9 Park Rd",
    addressLocality: "Southampton",
    postalCode: "SO15 3AS",
    addressCountry: "GB",
  },
  url: "https://danautocentre.co.uk",
};

export function JsonLd() {
  const localBusiness = {
    "@context": "https://schema.org",
    "@type": ["AutoRepair", "AutomotiveBusiness", "LocalBusiness"],
    name: BUSINESS.name,
    description:
      "Premium MOT, servicing, diagnostics, and repairs in Southampton—dealer-level equipment with independent workshop care.",
    image: `${BUSINESS.url}/og-image.jpg`,
    telephone: BUSINESS.phone,
    email: BUSINESS.email,
    url: BUSINESS.url,
    address: {
      "@type": "PostalAddress",
      ...BUSINESS.address,
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
      ratingValue: "4.7",
      reviewCount: "80",
    },
  };

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Do you offer MOT testing in Southampton?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes — Dan Auto Centre offers Class 4 MOT testing with online booking and same-week availability.",
        },
      },
      {
        "@type": "Question",
        name: "What services do you provide?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "MOT, servicing, diagnostics, brakes, clutches, timing belts, tyres, air conditioning, and general repairs for cars and vans.",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }}
      />
    </>
  );
}
