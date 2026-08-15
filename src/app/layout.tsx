import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { createAdminClient } from "@/lib/supabase/admin";
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

export async function generateMetadata(): Promise<Metadata> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("app_settings")
    .select("google_site_verification")
    .eq("id", true)
    .single();

  return {
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
    ...(data?.google_site_verification
      ? { verification: { google: data.google_site_verification } }
      : {}),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createAdminClient();
  const { data: settings } = await supabase
    .from("app_settings")
    .select("ga_measurement_id,gtm_id,facebook_pixel_id")
    .eq("id", true)
    .single();

  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900">
        {settings?.gtm_id && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${settings.gtm_id}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        {children}

        {settings?.gtm_id && (
          <Script id="gtm" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${settings.gtm_id}');`}
          </Script>
        )}
        {settings?.ga_measurement_id && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${settings.ga_measurement_id}`}
              strategy="afterInteractive"
            />
            <Script id="ga4" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${settings.ga_measurement_id}');`}
            </Script>
          </>
        )}
        {settings?.facebook_pixel_id && (
          <Script id="fb-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init', '${settings.facebook_pixel_id}');fbq('track', 'PageView');`}
          </Script>
        )}
      </body>
    </html>
  );
}
