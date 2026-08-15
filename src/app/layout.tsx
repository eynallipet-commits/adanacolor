import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const SITE_URL = "https://adanacoloralbum.com";
const SITE_TITLE = "Adana Color Albüm — Fotoğrafçılar için Albüm Üretimi";
const SITE_DESCRIPTION =
  "Fotoğrafçılara özel fotoğraf albümü, canvas ve foto baskı üretimi. Adana'dan tüm Türkiye'ye toptan albüm baskı, hızlı üretim ve güvenilir kargo.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s · Adana Color Albüm",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "fotoğraf albümü baskı",
    "toptan albüm üretimi",
    "fotoğrafçılar için albüm",
    "düğün albümü baskı",
    "canvas baskı",
    "foto büyütme baskı",
    "Adana albüm baskı",
  ],
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "Adana Color Albüm",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    images: [{ url: "/logo.png" }],
  },
  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/logo.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900">{children}</body>
    </html>
  );
}
