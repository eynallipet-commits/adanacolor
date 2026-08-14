"use client";

import Link from "next/link";
import { Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintBar({ backHref }: { backHref: string }) {
  return (
    <div className="print:hidden sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 sm:px-8">
      <Link href={backHref} className="flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900">
        <ArrowLeft className="h-4 w-4" />
        Geri Dön
      </Link>
      <Button size="sm" onClick={() => window.print()} className="gap-1.5">
        <Printer className="h-4 w-4" />
        Yazdır
      </Button>
    </div>
  );
}
