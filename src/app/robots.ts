import type { MetadataRoute } from "next";
import { COMPANY } from "@/lib/company";

const SITE_URL = COMPANY.siteUrl;

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
