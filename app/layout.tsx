import type { Metadata, Viewport } from "next";
import { Outfit, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/components/providers/AppProviders";
import { JsonLd } from "@/components/seo/JsonLd";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://danautocentre.co.uk";
const SITE_NAME = "Dan Auto Centre";
const DEFAULT_TITLE = "Dan Auto Centre | Premium MOT, Servicing & Diagnostics Southampton";
const DEFAULT_DESCRIPTION =
  "Southampton's independent workshop for dealer-grade diagnostics, MOT, servicing, and premium repairs. Private automotive concierge for BMW, Audi, Mercedes and all makes. Book online or call 023 8023 3552.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: [{ url: "/logo-emblem.svg", type: "image/svg+xml" }],
    apple: "/logo-emblem.svg",
  },
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "Dan Auto Centre",
    "car repairs Southampton",
    "MOT Southampton",
    "vehicle diagnostics Southampton",
    "car servicing Southampton",
    "garage SO15",
    "clutch replacement",
    "timing belt",
    "air con regas",
    "automotive garage Hampshire",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: { telephone: true, email: true, address: true },
  alternates: {
    canonical: "/",
    languages: {
      "en-GB": "/",
      en: "/",
      ru: "/?lang=ru",
      pl: "/?lang=pl",
      ro: "/?lang=ro",
      uk: "/?lang=uk",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Dan Auto Centre — Southampton automotive workshop",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "automotive",
};

export const viewport: Viewport = {
  themeColor: "#030303",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-GB"
      className={`${outfit.variable} ${geistMono.variable} dark h-full scroll-smooth`}
      suppressHydrationWarning
    >
      <head>
        <JsonLd />
      </head>
      <body className="min-h-full bg-background text-foreground antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
