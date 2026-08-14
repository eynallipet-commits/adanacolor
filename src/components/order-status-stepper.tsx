import { CreditCard, Landmark, Wallet, Factory, Truck, PackageCheck, Check, XCircle } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import type { OrderStatus, OrderStatusHistory, PaymentMethod } from "@/lib/database.types";

const STEP_ICONS: Record<string, React.ReactNode> = {
  pending_payment: <CreditCard className="h-4 w-4" />,
  payment_review: <Landmark className="h-4 w-4" />,
  paid: <Wallet className="h-4 w-4" />,
  in_production: <Factory className="h-4 w-4" />,
  shipped: <Truck className="h-4 w-4" />,
  delivered: <PackageCheck className="h-4 w-4" />,
};

export function OrderStatusStepper({
  status,
  paymentMethod,
  history,
}: {
  status: OrderStatus;
  paymentMethod: PaymentMethod | null;
  history: OrderStatusHistory[];
}) {
  if (status === "cancelled") {
    const cancelledAt = history.find((h) => h.status === "cancelled")?.created_at;
    return (
      <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
          <XCircle className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-medium text-red-800">Sipariş İptal Edildi</p>
          {cancelledAt && <p className="text-xs text-red-600">{formatDate(cancelledAt)}</p>}
        </div>
      </div>
    );
  }

  const sequence: OrderStatus[] =
    paymentMethod === "bank_transfer"
      ? ["pending_payment", "payment_review", "paid", "in_production", "shipped", "delivered"]
      : ["pending_payment", "paid", "in_production", "shipped", "delivered"];

  const currentIndex = sequence.indexOf(status);
  const dateFor = (s: OrderStatus) => history.find((h) => h.status === s)?.created_at;

  return (
    <ol>
      {sequence.map((s, i) => {
        const done = i < currentIndex;
        const current = i === currentIndex;
        const date = dateFor(s);
        const isLast = i === sequence.length - 1;

        return (
          <li key={s} className="relative flex gap-3 pb-6 last:pb-0">
            {!isLast && (
              <span
                className={cn(
                  "absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-px",
                  done ? "bg-brand-300" : "bg-neutral-200"
                )}
              />
            )}
            <span
              className={cn(
                "z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                done && "bg-brand-600 text-white",
                current && "bg-brand-100 text-brand-700 ring-2 ring-brand-600",
                !done && !current && "bg-neutral-100 text-neutral-400"
              )}
            >
              {done ? <Check className="h-4 w-4" /> : STEP_ICONS[s]}
            </span>
            <div className="pt-1">
              <p
                className={cn(
                  "text-sm font-medium",
                  done || current ? "text-neutral-900" : "text-neutral-400"
                )}
              >
                {ORDER_STATUS_LABELS[s]}
              </p>
              <p className="text-xs text-neutral-500">{date ? formatDate(date) : current ? "Şu an burada" : "Bekliyor"}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
