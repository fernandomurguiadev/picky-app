"use client";

import { usePathname } from "next/navigation";
import { Store, ChevronDown, LogOut } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useMyTenants, useSwitchTenant } from "@/lib/hooks/admin/use-tenant-switcher";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

export function AdminMobileHeader() {
  const pathname = usePathname();
  const activeTenantId = useAuthStore((s) => s.tenantId);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  // Consulta de Tenants vinculados al usuario logueado
  const { data: myTenants = [] } = useMyTenants();
  const switchTenantMutation = useSwitchTenant();

  // No renderizar en el onboarding
  if (pathname === "/admin/onboarding") {
    return null;
  }

  const tenantsList = Array.isArray(myTenants) ? myTenants : [];
  const activeTenant = tenantsList.find((t) => t.id === activeTenantId);

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
    <header className="md:hidden sticky top-0 z-40 w-full h-14 bg-card/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 shrink-0 shadow-sm transition-all duration-300">
      {/* Brand Logo */}
      <div className="flex items-center gap-1.5">
        <span className="text-base font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-rose-600">
          Picky
        </span>
        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary">
          Admin
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Selector de Tenants si tiene más de 1 */}
        {tenantsList.length > 1 ? (
          <div className="animate-in fade-in duration-300">
            <Select
              value={activeTenantId || undefined}
              disabled={switchTenantMutation.isPending}
              onValueChange={(val) => {
                if (val !== activeTenantId) {
                  switchTenantMutation.mutate(val);
                }
              }}
            >
              <SelectTrigger className="h-8 border border-border/80 bg-accent/40 hover:bg-accent/70 text-[11px] font-bold text-foreground focus:ring-0 focus:ring-offset-0 px-2.5 transition-all rounded-lg gap-1.5 shadow-sm flex items-center justify-between max-w-[150px] min-w-[100px]">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Store className="h-3.5 w-3.5 shrink-0 text-primary animate-pulse" />
                  <span className="truncate max-w-[90px]">
                    {activeTenant?.name || "Comercio..."}
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4} className="rounded-xl shadow-lg border-border/60 max-w-[200px] animate-in slide-in-from-top-1 duration-200">
                {tenantsList.map((t) => (
                  <SelectItem 
                    key={t.id} 
                    value={t.id} 
                    className="text-xs font-semibold py-2 cursor-pointer rounded-lg"
                  >
                    🏪 {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          /* Si tiene 1 solo, se muestra información elegante compacta */
          activeTenant && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-accent/30 border border-border/40 rounded-lg max-w-[150px] truncate animate-in fade-in duration-300">
              <Store className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="text-[10px] font-bold text-foreground truncate">{activeTenant.name}</span>
            </div>
          )
        )}

        <button
          onClick={handleLogout}
          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
          title="Cerrar sesión"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
