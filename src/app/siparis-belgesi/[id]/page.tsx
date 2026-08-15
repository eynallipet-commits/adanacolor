import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getOrderDetail } from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";
import { getAppSettings } from "@/lib/settings";
import { formatDate, formatTL } from "@/lib/utils";
import type { Company } from "@/lib/database.types";
import { Logo } from "@/components/layout/logo";
import { PrintBar } from "./print-bar";

const SELLER = {
  name: "Adana Color Foto Albüm San. Tic. Ltd. Şti.",
  address: "Adana, Türkiye",
};

export default async function SiparisBelgesiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const current = await getCurrentUser();
  if (!current) redirect(`/giris?next=/siparis-belgesi/${id}`);

  const { profile } = current;
  const detail = await getOrderDetail(id);
  if (!detail) notFound();

  const isOwner = profile.role === "photographer" && detail.order.company_id === profile.company_id;
  if (profile.role !== "admin" && !isOwner) notFound();

  const { order, items } = detail;
  const supabase = await createClient();
  const [{ data: company }, settings] = await Promise.all([
    supabase.from("companies").select("*").eq("id", order.company_id).single<Company>(),
    getAppSettings(),
  ]);

  const kdvRate = settings.invoice_kdv_rate;
  const matrah = order.total / (1 + kdvRate / 100);
  const kdvAmount = order.total - matrah;

  const backHref = profile.role === "admin" ? `/admin/siparisler/${order.id}` : `/panel/siparisler/${order.id}`;

  return (
    <div className="min-h-screen bg-neutral-100 print:bg-white">
      <PrintBar backHref={backHref} />
      <div className="mx-auto max-w-3xl bg-white p-8 shadow-sm print:shadow-none sm:p-12">
        <div className="flex items-start justify-between border-b border-neutral-200 pb-6">
          <div>
            <Logo height={30} />
            <p className="mt-1 text-sm text-neutral-500">{SELLER.name}</p>
            <p className="text-sm text-neutral-500">{SELLER.address}</p>
            {settings.invoice_seller_tax_office && (
              <p className="text-sm text-neutral-500">
                {settings.invoice_seller_tax_office}
                {settings.invoice_seller_tax_no ? ` · VKN ${settings.invoice_seller_tax_no}` : ""}
              </p>
            )}
            {settings.invoice_seller_iban && (
              <p className="text-sm text-neutral-500">IBAN: {settings.invoice_seller_iban}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-neutral-900">Fatura</p>
            <p className="text-sm text-neutral-500">
              {order.invoice_no ?? "Ödeme onaylandığında numaralandırılır"}
            </p>
            <p className="mt-2 text-sm font-medium text-neutral-700">Sipariş No: {order.order_no}</p>
            <p className="text-sm text-neutral-500">{formatDate(order.created_at)}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="font-semibold text-neutral-900">Alıcı</p>
            <p className="mt-1 text-neutral-600">{company?.name}</p>
            {company?.tax_office && <p className="text-neutral-600">{company.tax_office}</p>}
            {company?.tax_no && <p className="text-neutral-600">Vergi No: {company.tax_no}</p>}
            {company?.address && <p className="text-neutral-600">{company.address}</p>}
            {company?.phone && <p className="text-neutral-600">{company.phone}</p>}
          </div>
          <div>
            <p className="font-semibold text-neutral-900">Ödeme</p>
            <p className="mt-1 text-neutral-600">
              {order.payment_method === "credit_card" ? "Kredi Kartı" : "Havale/EFT"}
            </p>
            <p className="text-neutral-600">Kargo: {order.shipping_carrier || "—"}</p>
            <p className="text-neutral-600">Takip No: {order.tracking_number || "—"}</p>
          </div>
        </div>

        <table className="mt-8 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-neutral-300 text-left text-neutral-500">
              <th className="py-2">Ürün</th>
              <th className="py-2">Detay</th>
              <th className="py-2 text-right">Adet</th>
              <th className="py-2 text-right">Birim</th>
              <th className="py-2 text-right">Tutar</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-neutral-100">
                <td className="py-2.5 font-medium">{item.item_type === "album" ? item.sizeLabel : item.extraLabel}</td>
                <td className="py-2.5 text-neutral-500">
                  {item.item_type === "album" ? (
                    <>
                      {item.packageLabel} · {item.page_count} sayfa
                      {item.modelLabel ? ` · ${item.modelLabel}` : ""}
                      {item.cover_names_text ? ` · "${item.cover_names_text}"` : ""}
                      {item.colorLabel ? ` · Renk ${item.colorLabel}` : ""}
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-2.5 text-right">{item.quantity}</td>
                <td className="py-2.5 text-right">{formatTL(item.unit_price)}</td>
                <td className="py-2.5 text-right font-medium">{formatTL(item.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto mt-4 w-64 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-neutral-500">Ara Toplam</span>
            <span>{formatTL(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">İskonto (%{order.discount_rate})</span>
            <span>-{formatTL(order.discount_amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Matrah</span>
            <span>{formatTL(matrah)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">KDV (%{kdvRate})</span>
            <span>{formatTL(kdvAmount)}</span>
          </div>
          <div className="flex justify-between border-t border-neutral-200 pt-1 text-base font-bold text-neutral-900">
            <span>Genel Toplam</span>
            <span>{formatTL(order.total)}</span>
          </div>
        </div>

        <p className="mt-12 text-center text-xs text-neutral-400">
          Tutarlara %{kdvRate} KDV dahildir. Bu belge muhasebe kayıtları için düzenlenmiştir.
        </p>
      </div>
    </div>
  );
}
