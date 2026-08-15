import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { InstagramPost } from "@/lib/database.types";
import { SITE_ASSETS_BUCKET } from "@/lib/storage";
import { InstagramIcon } from "@/components/icons/instagram-icon";
import { InstagramManager } from "./instagram-manager";

export default async function AdminInstagramPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data } = await supabase
    .from("instagram_posts")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .returns<InstagramPost[]>();

  const posts = (data ?? []).map((post) => ({
    ...post,
    publicUrl: supabase.storage.from(SITE_ASSETS_BUCKET).getPublicUrl(post.image_path).data.publicUrl,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <InstagramIcon className="h-6 w-6 text-brand-600" />
          Instagram Galerisi
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Instagram&apos;da (@adanacoloralbum) paylaştığınız görselleri buraya da ekleyin; ana sayfadaki
          Instagram bölümünde otomatik olarak görünür. Instagram&apos;ın kendi API&apos;ı olmadan yeni
          paylaşımlar otomatik senkronize edilemez — yeni bir gönderi paylaştığınızda aynı görseli buraya
          yüklemeniz yeterli.
        </p>
      </div>
      <InstagramManager posts={posts} />
    </div>
  );
}
