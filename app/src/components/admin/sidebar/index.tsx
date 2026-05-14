"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Tag,
  Package,
  ShoppingBag,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/auth.store";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/catalog/categories", label: "Categorías", icon: Tag },
  { href: "/admin/catalog/products", label: "Productos", icon: Package },
  { href: "/admin/orders", label: "Pedidos", icon: ShoppingBag },
  { href: "/admin/settings/info", label: "Configuración", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignorar errores de red en logout
    }
    clearAuth();
    window.location.href = "/auth/login";
  };

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-card border-r border-border shrink-0 sticky top-0 h-screen">
      {/* Logo / Brand */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
        <span className="text-xl font-bold text-primary">PickyApp</span>
        <span className="text-xs text-muted-foreground">Admin</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
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
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4 border-t border-border pt-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
