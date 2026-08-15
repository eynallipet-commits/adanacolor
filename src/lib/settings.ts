import { createClient } from "@/lib/supabase/server";

export interface AppSettings {
  estimated_min_days: number;
  estimated_max_days: number;
  invoice_seller_tax_office: string | null;
  invoice_seller_tax_no: string | null;
  invoice_seller_iban: string | null;
  invoice_kdv_rate: number;
  seo_meta_title: string | null;
  seo_meta_description: string | null;
}

const DEFAULT_SETTINGS: AppSettings = {
  estimated_min_days: 7,
  estimated_max_days: 14,
  invoice_seller_tax_office: null,
  invoice_seller_tax_no: null,
  invoice_seller_iban: null,
  invoice_kdv_rate: 20,
  seo_meta_title: null,
  seo_meta_description: null,
};

export async function getAppSettings(): Promise<AppSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_settings")
    .select(
      "estimated_min_days,estimated_max_days,invoice_seller_tax_office,invoice_seller_tax_no,invoice_seller_iban,invoice_kdv_rate,seo_meta_title,seo_meta_description"
    )
    .eq("id", true)
    .single();
  return data ?? DEFAULT_SETTINGS;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function formatEstimatedDeliveryRange(fromDate: string | Date, settings: AppSettings) {
  const base = typeof fromDate === "string" ? new Date(fromDate) : fromDate;
  const from = addDays(base, settings.estimated_min_days);
  const to = addDays(base, settings.estimated_max_days);
  const fmt = new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "long" });
  return `${fmt.format(from)} - ${fmt.format(to)}`;
}
