import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://danautocentre.co.uk";
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/admin/login`, lastModified: now, changeFrequency: "monthly", priority: 0.2 },
  ];
}
