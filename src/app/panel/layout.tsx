import Link from "next/link";
import { requirePhotographer } from "@/lib/auth";
import { PanelNav } from "@/components/layout/panel-nav";
import { LogoutButton } from "@/components/layout/logout-button";
import { NotificationBell } from "@/components/layout/notification-bell";
import { Avatar } from "@/components/ui/avatar";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { profile, company } = await requirePhotographer();

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r border-neutral-200 bg-white p-4 md:flex md:flex-col">
        <Link href="/panel" className="font-display mb-6 px-2 text-lg font-bold tracking-tight">
          Adana <span className="text-brand-600">Color</span>
        </Link>
        <PanelNav />
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
      </aside>
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
          <Link href="/panel" className="font-display font-bold tracking-tight md:hidden">
            Adana <span className="text-brand-600">Color</span>
          </Link>
          <span className="hidden md:block" />
          <div className="flex items-center gap-2">
            <NotificationBell />
            <div className="md:hidden">
              <LogoutButton />
            </div>
          </div>
        </header>
        <main className="flex-1 bg-neutral-50 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
