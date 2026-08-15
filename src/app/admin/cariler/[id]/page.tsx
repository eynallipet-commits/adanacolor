import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, Users, Images, ShoppingBag, ClipboardList, PercentCircle, Wallet } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import type {
  AlbumModel,
  Company,
  CompanyBalanceTransaction,
  ExtraProduct,
  Order,
  Profile,
} from "@/lib/database.types";
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from "@/lib/order-status";
import { formatTL } from "@/lib/utils";
import { CompanyEditForm } from "./company-edit-form";
import { InviteUserForm } from "./invite-user-form";
import { CustomAlbumModels, CustomExtraProducts } from "./custom-products";
import { BalanceManager } from "./balance-manager";
import { DeleteCompanyButton } from "./delete-company-button";

export default async function CariDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin();
  const supabase = await createClient();

  const [companyRes, profilesRes, modelsRes, extrasRes, ordersRes, balanceTxRes] = await Promise.all([
    supabase.from("companies").select("*").eq("id", id).single<Company>(),
    supabase.from("profiles").select("*").eq("company_id", id).returns<Profile[]>(),
    supabase.from("album_models").select("*").eq("company_id", id).returns<AlbumModel[]>(),
    supabase.from("extra_products").select("*").eq("company_id", id).returns<ExtraProduct[]>(),
    supabase
      .from("orders")
      .select("*")
      .eq("company_id", id)
      .order("created_at", { ascending: false })
      .returns<Order[]>(),
    supabase
      .from("company_balance_transactions")
      .select("*")
      .eq("company_id", id)
      .order("created_at", { ascending: false })
      .returns<CompanyBalanceTransaction[]>(),
  ]);

  if (!companyRes.data) notFound();
  const company = companyRes.data;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={company.name} className="h-12 w-12 text-base" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{company.name}</h1>
            {company.contact_name && <p className="text-sm text-neutral-500">{company.contact_name}</p>}
            <Badge className="mt-1 gap-1 bg-brand-50 text-brand-700">
              <PercentCircle className="h-3.5 w-3.5" />
              İskonto %{company.discount_rate}
            </Badge>
          </div>
        </div>
        <DeleteCompanyButton companyId={company.id} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-brand-600" />
              Firma Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CompanyEditForm company={company} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4 text-brand-600" />
              Kullanıcılar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profilesRes.data && profilesRes.data.length > 0 ? (
              <ul className="divide-y divide-neutral-100 text-sm">
                {profilesRes.data.map((p) => (
                  <li key={p.id} className="flex items-center gap-2.5 py-2">
                    <Avatar name={p.full_name} className="h-7 w-7 text-xs" />
                    <span className="font-medium">{p.full_name || "İsimsiz"}</span>
                    <span className="text-neutral-500">· {p.status === "active" ? "Aktif" : p.status}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-neutral-500">Bu cariye ait kullanıcı yok.</p>
            )}
            <InviteUserForm companyId={company.id} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-brand-600" />
              Açık Hesap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BalanceManager
              companyId={company.id}
              balance={company.balance}
              blockEnabled={company.balance_block_enabled}
              transactions={balanceTxRes.data ?? []}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Images className="h-4 w-4 text-brand-600" />
              Bu Cariye Özel Kapak Modelleri
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CustomAlbumModels companyId={company.id} models={modelsRes.data ?? []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-brand-600" />
              Bu Cariye Özel Ekstra Ürünler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CustomExtraProducts companyId={company.id} extras={extrasRes.data ?? []} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-brand-600" />
            Siparişler
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!ordersRes.data || ordersRes.data.length === 0 ? (
            <EmptyState icon={<ClipboardList className="h-6 w-6" />} title="Sipariş yok" />
          ) : (
            <ul className="divide-y divide-neutral-100">
              {ordersRes.data.map((o) => (
                <li key={o.id} className="flex items-center justify-between py-2.5 text-sm">
                  <Link href={`/admin/siparisler/${o.id}`} className="font-medium hover:underline">
                    {o.order_no}
                  </Link>
                  <Badge className={ORDER_STATUS_COLORS[o.status]}>{ORDER_STATUS_LABELS[o.status]}</Badge>
                  <span className="font-medium">{formatTL(o.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
