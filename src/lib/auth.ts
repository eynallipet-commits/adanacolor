import { createClient } from "@/lib/supabase/server";
import type { Company, Profile } from "@/lib/database.types";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile) return null;

  let company: Company | null = null;
  if (profile.company_id) {
    const { data } = await supabase
      .from("companies")
      .select("*")
      .eq("id", profile.company_id)
      .single<Company>();
    company = data ?? null;
  }

  return { authUser: user, profile, company };
}

export async function requireUser() {
  const current = await getCurrentUser();
  if (!current) throw new Error("Oturum bulunamadı");
  return current;
}

export async function requireAdmin() {
  const current = await requireUser();
  if (current.profile.role !== "admin") throw new Error("Yetkiniz yok");
  return current;
}

export async function requirePhotographer() {
  const current = await requireUser();
  if (current.profile.role !== "photographer" || !current.profile.company_id) {
    throw new Error("Yetkiniz yok");
  }
  return current as typeof current & { profile: { company_id: string } };
}
