import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { InstagramPost } from "@/lib/database.types";
import { SITE_ASSETS_BUCKET } from "@/lib/storage";
import { InstagramIcon } from "@/components/icons/instagram-icon";

const INSTAGRAM_URL = "https://www.instagram.com/adanacoloralbum/";

export async function InstagramSection() {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("instagram_posts")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(8)
    .returns<InstagramPost[]>();

  const list = posts ?? [];

  return (
    <section className="border-t border-neutral-200 bg-white py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
            <InstagramIcon className="h-3.5 w-3.5" />
            Instagram
          </span>
          <h2 className="font-display mt-4 text-3xl font-bold text-neutral-900">Atölyeden Kareler</h2>
          <p className="mt-3 text-neutral-600">
            Son çalışmalarımızı Instagram&apos;da paylaşıyoruz — bizi takip edin.
          </p>
        </div>

        {list.length > 0 && (
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {list.map((post) => {
              const { data } = supabase.storage.from(SITE_ASSETS_BUCKET).getPublicUrl(post.image_path);
              return (
                <a
                  key={post.id}
                  href={post.permalink || INSTAGRAM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative aspect-square overflow-hidden rounded-xl ring-1 ring-neutral-900/5"
                >
                  <Image
                    src={data.publicUrl}
                    alt={post.caption || "Adana Color Instagram paylaşımı"}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/20 group-hover:opacity-100">
                    <InstagramIcon className="h-6 w-6 text-white" />
                  </div>
                </a>
              );
            })}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
          >
            <InstagramIcon className="h-4 w-4" />
            @adanacoloralbum&apos;u Takip Edin
          </Link>
        </div>
      </div>
    </section>
  );
}
