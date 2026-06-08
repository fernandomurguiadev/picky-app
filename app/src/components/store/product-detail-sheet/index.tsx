"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Drawer } from "vaul";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QuantitySelector } from "@/components/shared/quantity-selector";
import { toast } from "@/components/shared/toast";
import { VariantSelector } from "@/components/store/variant-selector";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/lib/stores/cart.store";
import { useStoreConfig } from "@/components/store/store-config-provider";
import { ServiceActionButton } from "@/components/store/actions/service-action-button";
import type { Product } from "@/lib/types/catalog";
import type { SelectedOption } from "@/lib/types/store";

interface ProductDetailSheetProps {
  product: Product;
  slug: string;
  open: boolean;
  onClose: () => void;
}

export function ProductDetailSheet({
  product,
  slug,
  open,
  onClose,
}: ProductDetailSheetProps) {
  const { storeType, customCtaText, whatsapp } = useStoreConfig();
  const isServices = storeType === "services";
  const showPrice = !(isServices && product.price === 0);

  const addItem = useCartStore((state) => state.addItem);
  const setTenantId = useCartStore((state) => state.setTenantId);
  const clearCart = useCartStore((state) => state.clearCart);
  const cartTenantId = useCartStore((state) => state.tenantId);
  const hasCartItems = useCartStore((state) => state.items.length > 0);

  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [isValid, setIsValid] = useState(true);
  const [isDesktop, setIsDesktop] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const resetState = () => {
    setSelectedOptions([]);
    setQuantity(1);
    setIsValid(true);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(query.matches);

    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const total = useMemo(() => {
    const optionsTotal = selectedOptions.reduce(
      (sum, option) => sum + option.priceModifier,
      0
    );
    return (product.price + optionsTotal) * quantity;
  }, [product.price, quantity, selectedOptions]);

  const executeAddToCart = () => {
    const cartItemId = `${product.id}:${selectedOptions
      .map((option) => option.itemId)
      .sort()
      .join("-") || "base"}`;

    setTenantId(product.tenantId);
    addItem({
      cartItemId,
      productId: product.id,
      name: product.name,
      unitPrice: product.price,
      imageUrl: product.imageUrl ?? undefined,
      quantity,
      selectedOptions: selectedOptions.map((option) => ({
        groupId: option.groupId,
        groupName: option.groupName,
        itemId: option.itemId,
        itemName: option.itemName,
        extraPrice: option.priceModifier,
      })),
    });

    // Removemos el toast.success anticuado. La confirmación visual ahora
    // se da mediante el Floating Cart Banner y el cierre del sheet.
    handleClose();
  };

  const handleAddToCart = () => {
    if (!isValid) {
      toast.error("Completá las opciones obligatorias antes de agregar.");
      return;
    }

    if (hasCartItems && cartTenantId && cartTenantId !== product.tenantId) {
      setShowConfirmModal(true);
      return;
    }

    executeAddToCart();
  };

  const handleConfirmClearCart = () => {
    clearCart();
    executeAddToCart();
    setShowConfirmModal(false);
  };

  const content = (
    <div className="flex flex-1 min-h-0 flex-col">
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-muted shrink-0">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 40vw"
            priority
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl text-muted-foreground">
            🍽️
          </div>
        )}
      </div>

      {/* Info del producto — siempre visible */}
      <div className="shrink-0 px-4 pt-4 pb-2">
        <div className="rounded-xl bg-[var(--color-primary)] p-4 text-[var(--color-primary-foreground)] space-y-2 shadow-xs">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-xl font-bold leading-tight">{product.name}</h2>
            {showPrice && (
              <span className="shrink-0 text-lg font-semibold bg-white/15 dark:bg-black/15 px-3 py-1 rounded-lg backdrop-blur-xs">
                {formatCurrency(product.price)}
              </span>
            )}
          </div>
          {product.description && (
            <p className="text-sm leading-relaxed opacity-90 text-[var(--color-primary-foreground)]/90">
              {product.description}
            </p>
          )}
        </div>
      </div>

      {/* Opcionales — solo en modo retail */}
      {!isServices && (
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
          <VariantSelector
            optionGroups={product.optionGroups ?? []}
            value={selectedOptions}
            onChange={setSelectedOptions}
            onValidityChange={setIsValid}
          />
        </div>
      )}

      <div className="border-t bg-background px-4 py-3">
        {isServices ? (
          <ServiceActionButton
            serviceName={product.name}
            whatsappNumber={whatsapp}
            ctaText={customCtaText}
          />
        ) : product.inStock ? (
          <div className="flex items-center justify-between gap-3">
            <QuantitySelector value={quantity} onChange={setQuantity} min={1} />
            <Button
              onClick={handleAddToCart}
              disabled={!isValid}
              className="min-w-44 bg-[var(--store-accent)] text-white hover:opacity-90"
            >
              Agregar {formatCurrency(total)}
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-xl bg-muted px-4 py-3">
            <span className="text-sm font-medium text-muted-foreground">Sin stock — no disponible para compra</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {isDesktop ? (
        <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && handleClose()}>
          <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0">
            <DialogHeader className="sr-only">
              <DialogTitle>{product.name}</DialogTitle>
              <DialogDescription>
                Detalle del producto de la tienda {slug}
              </DialogDescription>
            </DialogHeader>
            {content}
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer.Root open={open} onOpenChange={(nextOpen) => !nextOpen && handleClose()}>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
            <Drawer.Content className={`fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-[28px] bg-background outline-none ${!isServices && product.optionGroups?.length ? "max-h-[92vh]" : "max-h-[88vh]"}`}>
              <Drawer.Title className="sr-only">{product.name}</Drawer.Title>
              <Drawer.Description className="sr-only">
                Detalle del producto {product.name} de la tienda {slug}
              </Drawer.Description>
              <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-muted-foreground/30" />
              {content}
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      )}

      <ConfirmModal
        open={showConfirmModal}
        onOpenChange={setShowConfirmModal}
        title="¿Vaciar el carrito?"
        description="Tenés productos cargados de otro comercio. Al agregar este producto se borrará lo anterior. ¿Deseás continuar?"
        confirmLabel="Vaciar y agregar"
        variant="destructive"
        onConfirm={handleConfirmClearCart}
      />
    </>
  );
}
