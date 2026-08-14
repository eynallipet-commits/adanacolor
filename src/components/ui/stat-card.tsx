import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export function StatCard({
  icon,
  label,
  value,
  tone = "neutral",
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tone?: "neutral" | "brand" | "amber" | "emerald" | "indigo" | "purple";
  className?: string;
}) {
  const toneClasses: Record<string, string> = {
    neutral: "bg-neutral-100 text-neutral-600",
    brand: "bg-brand-50 text-brand-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    indigo: "bg-indigo-50 text-indigo-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-center gap-3">
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", toneClasses[tone])}>
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-xs leading-snug text-neutral-500 sm:text-sm">{label}</p>
          <p className="text-2xl font-bold text-neutral-900">{value}</p>
        </div>
      </div>
    </Card>
  );
}
