"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SITE_ASSETS_BUCKET } from "@/lib/storage";

export async function addInstagramPostAction(input: { imagePath: string; caption: string; permalink: string }) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("instagram_posts").insert({
    image_path: input.imagePath,
    caption: input.caption || null,
    permalink: input.permalink || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/admin/instagram");
  revalidatePath("/");
  return {};
}

export async function deleteInstagramPostAction(id: string, imagePath: string) {
  await requireAdmin();
  const supabase = await createClient();

  await supabase.storage.from(SITE_ASSETS_BUCKET).remove([imagePath]);
  await supabase.from("instagram_posts").delete().eq("id", id);

  revalidatePath("/admin/instagram");
  revalidatePath("/");
}
