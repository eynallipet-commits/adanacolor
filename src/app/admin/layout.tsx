import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { LogoutButton } from "@/components/layout/logout-button";
import { AdminNav } from "@/components/layout/admin-nav";
import { NotificationBell } from "@/components/layout/notification-bell";
import { Avatar } from "@/components/ui/avatar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAdmin();

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r border-neutral-800 bg-neutral-900 p-4 text-white md:flex md:flex-col">
        <Link href="/admin" className="font-display mb-6 flex items-center gap-2 px-2 text-lg font-bold tracking-tight">
          Adana <span className="text-brand-400">Color</span>
          <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-sans font-normal">Admin</span>
        </Link>
        <AdminNav />
        <div className="mt-auto space-y-3 border-t border-white/10 pt-4">
          <div className="flex items-center gap-2.5 px-2">
            <Avatar name={profile.full_name} className="bg-white/10 text-white" />
            <p className="truncate text-sm font-medium">{profile.full_name || "Yönetici"}</p>
          </div>
          <LogoutButton className="text-neutral-300 hover:bg-white/10 hover:text-white" />
        </div>
      </aside>
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
          <Link href="/admin" className="font-display font-bold tracking-tight md:hidden">
            Adana <span className="text-brand-600">Color</span> Admin
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
