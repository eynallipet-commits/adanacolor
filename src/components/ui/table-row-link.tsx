"use client";

import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { TR } from "./table";
import { cn } from "@/lib/utils";

export function TRLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  function handleClick(e: MouseEvent<HTMLTableRowElement>) {
    const target = e.target as HTMLElement;
    if (target.closest("a,button")) return;
    router.push(href);
  }

  return (
    <TR onClick={handleClick} className={cn("cursor-pointer", className)}>
      {children}
    </TR>
  );
}
