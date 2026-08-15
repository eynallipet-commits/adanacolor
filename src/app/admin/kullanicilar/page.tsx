import { ShieldCheck } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AdminUserManager } from "./admin-user-manager";
import type { Profile } from "@/lib/database.types";

export default async function KullanicilarPage() {
  const { profile: currentAdmin } = await requireAdmin();
  const adminClient = createAdminClient();

  const { data: admins } = await adminClient
    .from("profiles")
    .select("*")
    .eq("role", "admin")
    .order("created_at")
    .returns<Profile[]>();

  const { data: usersRes } = await adminClient.auth.admin.listUsers();
  const emailById = new Map(usersRes?.users.map((u) => [u.id, u.email ?? "—"]) ?? []);

  const rows = (admins ?? []).map((a) => ({ profile: a, email: emailById.get(a.id) ?? "—" }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Kullanıcılar</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand-600" />
            Yönetici Hesapları
          </CardTitle>
          <CardDescription>
            Admin paneline tam erişimi olan hesaplar. Yeni bir yönetici eklerken şifreyi doğrudan siz
            belirlersiniz.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminUserManager rows={rows} currentAdminId={currentAdmin.id} />
        </CardContent>
      </Card>
    </div>
  );
}
