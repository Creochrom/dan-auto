import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://danautocentre.co.uk";
  const now = new Date();
  const servicePages = [
    "/services",
    "/services/bmw-diagnostics",
    "/services/mot-prep",
    "/services/dpf-issues",
    "/services/timing-chain",
  ] as const;

  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...servicePages.map((path) => ({
      url: `${base}${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    { url: `${base}/admin/login`, lastModified: now, changeFrequency: "monthly", priority: 0.2 },
  ];
}
