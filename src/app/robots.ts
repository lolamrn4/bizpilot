import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/app", "/admin", "/api", "/r/", "/invite", "/onboarding", "/auth"] }],
    sitemap: "https://www.bizpilotappgn.xyz/sitemap.xml",
  };
}
