import Image from "next/image";
import Link from "next/link";
import { StoreStatusBadge } from "@/components/store/store-status-badge";
import { CartDrawer } from "@/components/store/cart-drawer";
import { CartBadge } from "@/components/store/cart-badge";
import { StoreSearchBar } from "@/components/store/store-search-bar";
import type { StorePublicData, DaySchedule } from "@/lib/types/store";

interface StoreHeaderProps {
  store: StorePublicData;
  isOpen: boolean;
  todaySchedule?: DaySchedule | null;
}

export function StoreHeader({ store, isOpen, todaySchedule }: StoreHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-transparent pointer-events-none transition-colors duration-200">
      {/* Barra superior con color de fondo del comercio */}
      <div className="w-full border-b border-[var(--color-primary)]/10 bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-xs pointer-events-auto">
        <div className="mx-auto flex h-14 max-w-4xl lg:max-w-7xl items-center justify-between px-4">
          <Link href={`/${store.slug}`} className="flex items-center gap-2.5 min-w-0 text-[var(--color-primary-foreground)]">
            {store.logoUrl ? (
              <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-[var(--color-primary-foreground)]/20 bg-[var(--color-primary-foreground)]">
                <Image
                  src={store.logoUrl}
                  alt={store.name}
                  fill
                  className="object-cover"
                  sizes="32px"
                />
              </div>
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-foreground)] text-[var(--color-primary)] text-sm font-bold shadow-inner">
                {store.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="truncate font-semibold text-sm">{store.name}</span>
          </Link>

          <div className="flex items-center gap-3">
            <StoreStatusBadge isOpen={isOpen} todaySchedule={todaySchedule} />
            <CartDrawer>
              <CartBadge />
            </CartDrawer>
          </div>
        </div>
      </div>

      {/* Buscador flotante siempre visible en mobile */}
      <div className="mx-auto max-w-4xl px-4 py-2 lg:hidden pointer-events-auto">
        <div className="shadow-[0_8px_30px_rgba(0,0,0,0.12)] rounded-lg">
          <StoreSearchBar slug={store.slug} />
        </div>
      </div>
    </header>
  );
}
