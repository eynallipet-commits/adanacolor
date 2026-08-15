import Link from "next/link";
import type { Metadata } from "next";
import { requirePhotographer } from "@/lib/auth";

export const metadata: Metadata = { robots: { index: false, follow: false } };
import { PanelNav } from "@/components/layout/panel-nav";
import { LogoutButton } from "@/components/layout/logout-button";
import { NotificationBell } from "@/components/layout/notification-bell";
import { MobileDrawer } from "@/components/layout/mobile-drawer";
import { Logo } from "@/components/layout/logo";
import { Avatar } from "@/components/ui/avatar";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { profile, company } = await requirePhotographer();

  const brand = (
    <Link href="/panel" className="flex items-center px-2">
      <Logo height={30} />
    </Link>
  );

  const userBlock = (
    <div className="mt-auto space-y-3 border-t border-neutral-200 pt-4">
      <div className="flex items-center gap-2.5 px-2">
        <Avatar name={profile.full_name} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-neutral-900">{company?.name}</p>
          <p className="truncate text-xs text-neutral-500">{profile.full_name}</p>
        </div>
      </div>
      <LogoutButton />
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r border-neutral-200 bg-white p-4 md:flex md:flex-col">
        <div className="mb-6">{brand}</div>
        <PanelNav />
        {userBlock}
      </aside>
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
          <div className="flex items-center gap-1 md:hidden">
            <MobileDrawer header={brand} variant="light">
              <PanelNav />
              {userBlock}
            </MobileDrawer>
            <Link href="/panel" className="flex items-center">
              <Logo height={24} />
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
