"use client";

import { LayoutDashboard, ClipboardList, PlusCircle, UserCircle } from "lucide-react";
import { NavLinks } from "./nav-links";

const items = [
  { href: "/panel", label: "Özet", icon: LayoutDashboard },
  { href: "/panel/siparisler", label: "Siparişlerim", icon: ClipboardList },
  { href: "/panel/siparis-olustur", label: "Yeni Sipariş", icon: PlusCircle },
  { href: "/panel/hesap", label: "Hesabım", icon: UserCircle },
];

export function PanelNav() {
  return <NavLinks items={items} variant="light" />;
}
