import { createClient } from "@/lib/supabase/server";

export interface AppSettings {
  estimated_min_days: number;
  estimated_max_days: number;
}

const DEFAULT_SETTINGS: AppSettings = { estimated_min_days: 7, estimated_max_days: 14 };

export async function getAppSettings(): Promise<AppSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("estimated_min_days,estimated_max_days")
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
