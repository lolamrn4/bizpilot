import type { MetadataRoute } from "next";
import { GUIDES } from "@/lib/guides";

const BASE = "https://www.bizpilotappgn.xyz";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/guides`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    ...GUIDES.map((g) => ({ url: `${BASE}/guides/${g.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.7 })),
    ...["terms", "privacy", "refund", "notice"].map((doc) => ({ url: `${BASE}/legal/${doc}`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.2 })),
  ];
}
