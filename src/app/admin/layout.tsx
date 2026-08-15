import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { robots: { index: false, follow: false } };
import { LogoutButton } from "@/components/layout/logout-button";
import { AdminNav } from "@/components/layout/admin-nav";
import { NotificationBell } from "@/components/layout/notification-bell";
import { MobileDrawer } from "@/components/layout/mobile-drawer";
import { Logo } from "@/components/layout/logo";
import { Avatar } from "@/components/ui/avatar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAdmin();

  const brand = (
    <Link href="/admin" className="flex items-center gap-2 px-2">
      <span className="inline-flex items-center rounded-md bg-white px-2 py-1.5">
        <Logo height={20} />
      </span>
      <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-medium">Admin</span>
    </Link>
  );

  const userBlock = (
    <div className="mt-auto space-y-3 border-t border-white/10 pt-4">
      <div className="flex items-center gap-2.5 px-2">
        <Avatar name={profile.full_name} className="bg-white/10 text-white" />
        <p className="truncate text-sm font-medium">{profile.full_name || "Yönetici"}</p>
      </div>
      <LogoutButton className="text-neutral-300 hover:bg-white/10 hover:text-white" />
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r border-neutral-800 bg-neutral-900 p-4 text-white md:flex md:flex-col">
        <div className="mb-6">{brand}</div>
        <AdminNav />
        {userBlock}
      </aside>
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
          <div className="flex items-center gap-1 md:hidden">
            <MobileDrawer header={brand} variant="dark">
              <AdminNav />
              {userBlock}
            </MobileDrawer>
            <Link href="/admin" className="flex items-center gap-2">
              <Logo height={22} />
              <span className="text-sm text-neutral-500">Admin</span>
            </Link>
          </div>
          <span className="hidden md:block" />
          <div className="flex items-center gap-2">
            <NotificationBell />
            <div className="md:hidden">
              <LogoutButton />
            </div>
          </div>
        </header>
        <main className="min-w-0 flex-1 bg-neutral-50 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
