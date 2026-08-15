"use client";

import { useActionState } from "react";
import { updateSeoSettingsAction, type FormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AppSettings } from "@/lib/settings";

const initial: FormState = {};

export function SeoSettingsForm({ settings }: { settings: AppSettings }) {
  const [state, formAction, isPending] = useActionState(updateSeoSettingsAction, initial);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <Label htmlFor="seo_meta_title">Sayfa Başlığı (title)</Label>
        <Input
          id="seo_meta_title"
          name="seo_meta_title"
          defaultValue={settings.seo_meta_title ?? ""}
          placeholder="Adana Color Albüm — Fotoğrafçılar için Albüm Üretimi"
        />
      </div>
      <div>
        <Label htmlFor="seo_meta_description">Meta Açıklama (description)</Label>
        <Textarea
          id="seo_meta_description"
          name="seo_meta_description"
          rows={3}
          defaultValue={settings.seo_meta_description ?? ""}
          placeholder="Google arama sonuçlarında başlığın altında görünecek kısa açıklama."
        />
      </div>
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Kaydediliyor..." : "Kaydet"}
      </Button>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
