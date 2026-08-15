import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHostname
      ? [{ protocol: "https", hostname: supabaseHostname, pathname: "/storage/v1/object/public/**" }]
      : [],
    // Next.js 16'da varsayılan yalnızca [75]. Katalog kapak görselleri müşteriye
    // ürün seçtirdiği için daha yüksek kalitede sunuluyor.
    qualities: [75, 90, 95],
  },
};

export default nextConfig;
