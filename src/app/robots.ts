import type { MetadataRoute } from "next";

const SITE_URL = "https://adanacoloralbum.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/panel", "/siparis-belgesi", "/sifre-sifirla"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
