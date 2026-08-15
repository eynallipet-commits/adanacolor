"use client";

import { useState, useTransition } from "react";
import { Wallet } from "lucide-react";
import { adjustCompanyBalanceAction, toggleBalanceBlockAction } from "../actions";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatTL } from "@/lib/utils";
import type { CompanyBalanceTransaction } from "@/lib/database.types";

export function BalanceManager({
  companyId,
  balance,
  blockEnabled,
  transactions,
}: {
  companyId: string;
  balance: number;
  blockEnabled: boolean;
  transactions: CompanyBalanceTransaction[];
}) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isToggling, startToggle] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2.5">
        <div>
          <p className="text-xs text-neutral-500">Güncel Bakiye</p>
          <p className={`text-lg font-semibold ${balance > 0 ? "text-red-600" : "text-neutral-900"}`}>
            {formatTL(balance)}
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs text-neutral-600">
          <input
            type="checkbox"
            checked={blockEnabled}
            disabled={isToggling}
            onChange={(e) => {
              const checked = e.target.checked;
              startToggle(async () => {
                await toggleBalanceBlockAction(companyId, checked);
              });
            }}
          />
          Sipariş öncesi bakiye sıfır olmalı
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="balance-amount">Tutar (borç: +, ödeme: -)</Label>
          <CurrencyInput
            id="balance-amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div>
          <Label htmlFor="balance-note">Not</Label>
          <Input id="balance-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Örn: Devir bakiye" />
        </div>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <Button
        type="button"
        size="sm"
        disabled={isPending || !amount}
        onClick={() =>
          startTransition(async () => {
            const res = await adjustCompanyBalanceAction(companyId, Number(amount), note);
            if (res.error) setError(res.error);
            else {
              setError(null);
              setAmount("");
              setNote("");
            }
          })
        }
      >
        {isPending ? "Kaydediliyor..." : "Bakiye Hareketi Ekle"}
      </Button>

      {transactions.length > 0 && (
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-neutral-600">
            <Wallet className="h-3.5 w-3.5" />
            Hareket Geçmişi
          </p>
          <ul className="max-h-48 space-y-1 overflow-y-auto divide-y divide-neutral-100 text-sm">
            {transactions.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-1.5">
                <span className="text-neutral-500">
                  {new Date(t.created_at).toLocaleDateString("tr-TR")}
                  {t.note ? ` · ${t.note}` : ""}
                </span>
                <span className={t.amount > 0 ? "font-medium text-red-600" : "font-medium text-emerald-600"}>
                  {t.amount > 0 ? "+" : ""}
                  {formatTL(t.amount)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
