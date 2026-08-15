"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function NavLinks({ items, variant = "light" }: { items: NavItem[]; variant?: "light" | "dark" }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active =
          item.href === "/panel" || item.href === "/admin"
            ? pathname === item.href
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              variant === "light" &&
                (active ? "bg-brand-50 text-brand-700" : "text-neutral-600 hover:bg-neutral-100"),
              variant === "dark" &&
                (active ? "bg-white/10 text-white" : "text-neutral-300 hover:bg-white/10 hover:text-white")
            )}
          >
            <item.icon className={cn("h-4 w-4 shrink-0", variant === "light" && active && "text-brand-600")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
