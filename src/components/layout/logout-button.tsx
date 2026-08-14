import { logoutAction } from "@/app/giris/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LogoutButton({ className }: { className?: string }) {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="ghost" size="sm" className={cn("w-full justify-start", className)}>
        Çıkış Yap
      </Button>
    </form>
  );
}
