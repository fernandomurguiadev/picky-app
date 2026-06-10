"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import axios from "axios";
import { usePlatformAuthStore } from "@/lib/stores/platform-auth.store";

const NAV_ITEMS = [
  { href: "/platform/tenants", label: "Tenants" },
  { href: "/platform/plans", label: "Planes" },
  { href: "/platform/audit-logs", label: "Auditoría" },
];

export function PlatformSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { email, clearAuth } = usePlatformAuthStore();

  async function handleLogout() {
    try {
      await axios.post("/api/platform/auth/logout", {}, { withCredentials: true });
    } finally {
      clearAuth();
      router.replace("/platform/login");
    }
  }

  return (
    <aside className="w-56 shrink-0 border-r bg-card flex flex-col">
      <div className="px-4 py-5 border-b">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Platform Admin
        </p>
        <p className="text-sm font-medium mt-1 truncate">{email}</p>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 py-4 border-t">
        <button
          onClick={handleLogout}
          className="w-full flex items-center rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
