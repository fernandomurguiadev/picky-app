import Image from "next/image";
import Link from "next/link";
import { StoreStatusBadge } from "@/components/store/store-status-badge";
import { CartDrawer } from "@/components/store/cart-drawer";
import { CartBadge } from "@/components/store/cart-badge";
import type { StorePublicData } from "@/lib/types/store";

interface StoreHeaderProps {
  store: StorePublicData;
  isOpen: boolean;
}

export function StoreHeader({ store, isOpen }: StoreHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <Link href={`/${store.slug}`} className="flex items-center gap-2.5 min-w-0">
          {store.logoUrl ? (
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full">
              <Image
                src={store.logoUrl}
                alt={store.name}
                fill
                className="object-cover"
                sizes="32px"
              />
            </div>
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-white text-sm font-bold">
              {store.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="truncate font-semibold text-sm">{store.name}</span>
        </Link>

        <div className="flex items-center gap-3">
          <StoreStatusBadge isOpen={isOpen} />
          <CartDrawer>
            <CartBadge />
          </CartDrawer>
        </div>
      </div>
    </header>
  );
}
