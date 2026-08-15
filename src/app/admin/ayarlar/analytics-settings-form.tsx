"use client";

import { useActionState } from "react";
import { updateAnalyticsSettingsAction, type FormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AppSettings } from "@/lib/settings";

const initial: FormState = {};

export function AnalyticsSettingsForm({ settings }: { settings: AppSettings }) {
  const [state, formAction, isPending] = useActionState(updateAnalyticsSettingsAction, initial);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      <div>
        <Label htmlFor="ga_measurement_id">Google Analytics (GA4) Measurement ID</Label>
        <Input
          id="ga_measurement_id"
          name="ga_measurement_id"
          placeholder="G-XXXXXXXXXX"
          defaultValue={settings.ga_measurement_id ?? ""}
        />
      </div>
      <div>
        <Label htmlFor="gtm_id">Google Tag Manager ID</Label>
        <Input
          id="gtm_id"
          name="gtm_id"
          placeholder="GTM-XXXXXXX"
          defaultValue={settings.gtm_id ?? ""}
        />
      </div>
      <div>
        <Label htmlFor="facebook_pixel_id">Meta (Facebook) Pixel ID</Label>
        <Input
          id="facebook_pixel_id"
          name="facebook_pixel_id"
          placeholder="123456789012345"
          defaultValue={settings.facebook_pixel_id ?? ""}
        />
      </div>
      <div>
        <Label htmlFor="google_site_verification">Google Search Console Doğrulama Kodu</Label>
        <Input
          id="google_site_verification"
          name="google_site_verification"
          placeholder="HTML etiket doğrulama içeriği (content=&quot;...&quot;)"
          defaultValue={settings.google_site_verification ?? ""}
        />
      </div>
      <Button type="submit" size="sm" className="sm:col-span-2 sm:w-fit" disabled={isPending}>
        {isPending ? "Kaydediliyor..." : "Kaydet"}
      </Button>
      {state.error && <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p>}
      <p className="text-xs text-neutral-500 sm:col-span-2">
        GA4 ve GTM birlikte de kullanılabilir. Değişiklikler siteye birkaç dakika içinde yansır.
      </p>
    </form>
  );
}
