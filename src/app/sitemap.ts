import type { MetadataRoute } from "next";
import { COMPANY } from "@/lib/company";

const SITE_URL = COMPANY.siteUrl;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/basvuru`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];
}
