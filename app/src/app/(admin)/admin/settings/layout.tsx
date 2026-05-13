"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const sections = [
  { href: "/admin/settings/info", label: "Información general" },
  { href: "/admin/settings/hours", label: "Horarios" },
  { href: "/admin/settings/delivery", label: "Entrega" },
  { href: "/admin/settings/payments", label: "Pagos" },
  { href: "/admin/settings/theme", label: "Tema" },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Configuración</h1>

      {/* Mobile: tabs */}
      <nav className="flex gap-1 overflow-x-auto pb-1 mb-6 md:hidden">
        {sections.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
              pathname === href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {label}
          </Link>
        ))}
      </nav>

      <div className="flex gap-8">
        {/* Desktop: sidebar */}
        <aside className="hidden md:block w-52 shrink-0">
          <nav className="space-y-1 sticky top-8">
            {sections.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
