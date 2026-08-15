"use client";

import { LayoutDashboard, FileCheck2, Users, Boxes, ClipboardList, BarChart3 } from "lucide-react";
import { InstagramIcon } from "@/components/icons/instagram-icon";
import { NavLinks } from "./nav-links";

const items = [
  { href: "/admin", label: "Özet", icon: LayoutDashboard },
  { href: "/admin/basvurular", label: "Üyelik Başvuruları", icon: FileCheck2 },
  { href: "/admin/cariler", label: "Cariler", icon: Users },
  { href: "/admin/urunler", label: "Ürünler & Fiyatlar", icon: Boxes },
  { href: "/admin/siparisler", label: "Siparişler", icon: ClipboardList },
  { href: "/admin/raporlar", label: "Raporlar", icon: BarChart3 },
  { href: "/admin/instagram", label: "Instagram Galerisi", icon: InstagramIcon },
];

export function AdminNav() {
  return <NavLinks items={items} variant="dark" />;
}
