"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Tag,
  Package,
  ShoppingBag,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/dashboard", label: "Dash", icon: LayoutDashboard },
  { href: "/admin/catalog/categories", label: "Cats", icon: Tag },
  { href: "/admin/catalog/products", label: "Prods", icon: Package },
  { href: "/admin/orders", label: "Pedidos", icon: ShoppingBag },
  { href: "/admin/settings/info", label: "Config", icon: Settings },
];

export function AdminMobileNav() {
  const pathname = usePathname();

  // No renderizar en el onboarding ya que ahí no necesitamos navegar
  if (pathname === "/admin/onboarding") {
    return null;
  }

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex justify-around items-center py-2 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === "/admin/dashboard"
            ? pathname === href
            : pathname.startsWith(href);
            
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-1 w-16 py-1 rounded-lg transition-all",
              isActive
                ? "text-primary scale-105"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className={cn(
              "p-1 rounded-md transition-colors",
              isActive && "bg-primary/10 text-primary"
            )}>
              <Icon className="h-5 w-5" />
            </div>
            <span className="text-[9px] font-extrabold tracking-tight uppercase">
              {label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
