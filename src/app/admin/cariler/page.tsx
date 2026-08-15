import Link from "next/link";
import { Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import type { Company } from "@/lib/database.types";
import { formatTL } from "@/lib/utils";
import { NewCompanyForm } from "./new-company-form";

export default async function CarilerPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: companies } = await supabase
    .from("companies")
    .select("*")
    .order("name")
    .returns<Company[]>();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Cariler</h1>
        <NewCompanyForm />
      </div>
      <Card>
        <CardContent className="p-0">
          {!companies || companies.length === 0 ? (
            <EmptyState icon={<Users className="h-6 w-6" />} title="Henüz cari yok" />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Firma</TH>
                  <TH>Telefon</TH>
                  <TH>E-posta</TH>
                  <TH className="text-right">İskonto</TH>
                  <TH className="text-right">Açık Hesap</TH>
                  <TH>Durum</TH>
                </TR>
              </THead>
              <TBody>
                {companies.map((c) => (
                  <TR key={c.id}>
                    <TD>
                      <Link href={`/admin/cariler/${c.id}`} className="font-medium hover:underline">
                        {c.name}
                      </Link>
                    </TD>
                    <TD className="text-neutral-500">{c.phone || "—"}</TD>
                    <TD className="text-neutral-500">{c.email || "—"}</TD>
                    <TD className="text-right">%{c.discount_rate}</TD>
                    <TD className={`text-right ${c.balance > 0 ? "font-medium text-red-600" : "text-neutral-400"}`}>
                      {formatTL(c.balance)}
                    </TD>
                    <TD className="text-neutral-500">{c.status === "active" ? "Aktif" : "Pasif"}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
