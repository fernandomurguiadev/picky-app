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
  Store,
  ChevronDown,
  Warehouse,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useMyTenants, useSwitchTenant } from "@/lib/hooks/admin/use-tenant-switcher";
import { useStoreSettings } from "@/lib/hooks/admin/use-store-settings";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AdminSidebar() {
  const pathname = usePathname();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const activeTenantId = useAuthStore((s) => s.tenantId);
  const { data: settings } = useStoreSettings();
  const { data: myTenants = [], isLoading } = useMyTenants();
  const switchTenantMutation = useSwitchTenant();

  if (pathname === "/admin/onboarding") return null;

  const isServices = settings?.storeType === "services";

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/catalog/categories", label: "Categorías", icon: Tag },
    { href: "/admin/catalog/products", label: isServices ? "Servicios" : "Productos", icon: Package },
    ...(!isServices ? [
      { href: "/admin/inventory", label: "Inventario", icon: Warehouse },
      { href: "/admin/orders", label: "Pedidos", icon: ShoppingBag },
    ] : []),
    { href: "/admin/reports", label: "Rentabilidad", icon: TrendingUp },
    { href: "/admin/settings/info", label: "Configuración", icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignorar errores de red en logout
    }
    clearAuth();
    window.location.href = "/auth/login";
  };

  const tenantsList = Array.isArray(myTenants) ? myTenants : [];
  const activeTenant = tenantsList.find((t) => t.id === activeTenantId);

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-card border-r border-border shrink-0 sticky top-0 h-screen">
      {/* Logo / Brand */}
      <div className="px-6 py-5 border-b border-border flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary">PickyApp</span>
          <span className="text-xs text-muted-foreground">Admin</span>
        </div>

        {/* Dropdown de Switch Tenant si tiene más de 1 */}
        {tenantsList.length > 1 ? (
          <div className="w-full animate-in fade-in duration-300">
            <Select
              value={activeTenantId || undefined}
              disabled={switchTenantMutation.isPending}
              onValueChange={(val) => {
                if (val !== activeTenantId) {
                  switchTenantMutation.mutate(val);
                }
              }}
            >
              <SelectTrigger className="w-full h-10 border border-border/80 bg-accent/40 hover:bg-accent/70 text-xs font-bold text-foreground focus:ring-0 focus:ring-offset-0 px-3 transition-all rounded-xl gap-2 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Store className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate max-w-[130px]">
                    {activeTenant?.name || "Seleccionar..."}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4} className="rounded-xl shadow-lg border-border/60 max-w-[220px] animate-in slide-in-from-top-1 duration-200">
                {tenantsList.map((t) => (
                  <SelectItem 
                    key={t.id} 
                    value={t.id} 
                    className="text-xs font-semibold py-2.5 cursor-pointer rounded-lg"
                  >
                    🏪 {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          /* Si tiene 1 solo inquilino, mostramos información estática elegante */
          activeTenant && (
            <div className="flex items-center gap-2 px-3 py-2 bg-accent/30 border border-border/40 rounded-xl max-w-full truncate animate-in fade-in duration-300">
              <Store className="h-4 w-4 shrink-0 text-primary" />
              <span className="text-xs font-bold text-foreground truncate">{activeTenant.name}</span>
            </div>
          )
        )}
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
