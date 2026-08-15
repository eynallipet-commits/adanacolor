import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAppSettings } from "@/lib/settings";
import type { Company, Order } from "@/lib/database.types";

function csvEscape(value: string) {
  if (/[",\n;]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Yetkiniz yok." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const supabase = await createClient();
  const settings = await getAppSettings();
  const kdvRate = settings.invoice_kdv_rate;

  let query = supabase.from("orders").select("*").not("invoice_no", "is", null).order("created_at");
  if (from) query = query.gte("created_at", `${from}T00:00:00`);
  if (to) query = query.lte("created_at", `${to}T23:59:59`);

  const { data: orders } = await query.returns<Order[]>();
  const rows = orders ?? [];

  const companyIds = Array.from(new Set(rows.map((o) => o.company_id)));
  const { data: companies } = await supabase.from("companies").select("*").in("id", companyIds).returns<Company[]>();
  const companyMap = new Map((companies ?? []).map((c) => [c.id, c]));

  const header = [
    "Fatura No",
    "Sipariş No",
    "Tarih",
    "Firma",
    "Vergi Dairesi",
    "Vergi No",
    "Matrah",
    "KDV Oranı",
    "KDV Tutarı",
    "Genel Toplam",
  ];

  const lines = [header.join(";")];
  for (const o of rows) {
    const company = companyMap.get(o.company_id);
    const matrah = o.total / (1 + kdvRate / 100);
    const kdvAmount = o.total - matrah;
    lines.push(
      [
        o.invoice_no ?? "",
        o.order_no ?? "",
        new Date(o.created_at).toLocaleDateString("tr-TR"),
        company?.name ?? "",
        company?.tax_office ?? "",
        company?.tax_no ?? "",
        matrah.toFixed(2),
        `${kdvRate}`,
        kdvAmount.toFixed(2),
        o.total.toFixed(2),
      ]
        .map((v) => csvEscape(String(v)))
        .join(";")
    );
  }

  const csv = "﻿" + lines.join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="faturalar-${from ?? "tumu"}-${to ?? "tumu"}.csv"`,
    },
  });
}
