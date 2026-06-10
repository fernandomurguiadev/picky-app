"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ImageUploader } from "@/components/shared/image-uploader";
import { OptionGroupEditor } from "@/components/admin/option-group-editor";
import { useCategories } from "@/lib/hooks/admin/use-categories";
import { useCreateProduct, useUpdateProduct } from "@/lib/hooks/admin/use-products";
import { useStoreSettings } from "@/lib/hooks/admin/use-store-settings";
import { toast } from "@/components/shared/toast";
import { fromCents, tosCents, formatCurrency } from "@/lib/utils";
import type { Product, ProductFormData } from "@/lib/types/catalog";

function formatThousands(n: number): string {
  if (!n) return "";
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function PriceInput({
  value,
  onChange,
  disabled,
  id,
  "aria-invalid": ariaInvalid,
}: {
  value: number;
  onChange: (val: number) => void;
  disabled?: boolean;
  id?: string;
  "aria-invalid"?: boolean;
}) {
  const [display, setDisplay] = useState(() => formatThousands(value));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\./g, "").replace(/\D/g, "");
    const num = raw ? parseInt(raw, 10) : 0;
    setDisplay(raw ? formatThousands(num) : "");
    onChange(num);
  };

  return (
    <Input
      id={id}
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      disabled={disabled}
      aria-invalid={ariaInvalid}
      placeholder="0"
      className="pl-7"
    />
  );
}

const DRAFT_KEY = "picky-product-draft";
const AUTOSAVE_MS = 30_000;

const schema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(255),
  description: z.string().max(2000),
  categoryId: z.string().uuid("Seleccioná una categoría"),
  price: z.number().min(0, "El precio no puede ser negativo"),
  imageUrl: z.string().nullable(),
  imagePublicId: z.string().nullable(),
  isFeatured: z.boolean(),
  isActive: z.boolean(),
  inStock: z.boolean(),
  stockQuantity: z.number().int().min(0).nullable(),
  optionGroups: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string().min(1, "El nombre del grupo es requerido"),
      type: z.enum(["radio", "checkbox"]),
      isRequired: z.boolean(),
      minSelections: z.number().int().min(0),
      maxSelections: z.number().int().min(1),
      order: z.number().int().min(0),
      items: z.array(
        z.object({
          id: z.string().optional(),
          name: z.string().min(1, "El nombre del item es requerido"),
          priceModifier: z.number().int().min(0),
          isDefault: z.boolean(),
          order: z.number().int().min(0),
        })
      ),
    })
  ),
});

interface ProductFormPageProps {
  product?: Product;
}

export default function ProductFormPage({ product }: ProductFormPageProps) {
  const router = useRouter();
  const isEdit = !!product;
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const { data: categories } = useCategories();
  const { data: storeSettings } = useStoreSettings();
  const isServices = storeSettings?.storeType === "services";

  const [saveIndicator, setSaveIndicator] = useState<"idle" | "saving" | "saved">("idle");
  const [isImageUploading, setIsImageUploading] = useState(false);
  const autosaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const buildProductValues = (p: Product): ProductFormData => ({
    name: p.name,
    description: p.description ?? "",
    categoryId: p.categoryId || p.category?.id || "",
    price: fromCents(p.price),
    imageUrl: p.imageUrl ?? null,
    imagePublicId: p.imagePublicId ?? null,
    isFeatured: p.isFeatured,
    isActive: p.isActive,
    inStock: p.inStock,
    stockQuantity: p.stockQuantity ?? null,
    optionGroups: (p.optionGroups ?? []).map((og) => ({
      id: og.id,
      name: og.name,
      type: og.type as "radio" | "checkbox",
      isRequired: og.isRequired,
      minSelections: og.minSelections,
      maxSelections: og.maxSelections,
      order: og.order,
      items: (og.items ?? []).map((it) => ({
        id: it.id,
        name: it.name,
        priceModifier: it.priceModifier,
        isDefault: it.isDefault,
        order: it.order,
      })),
    })),
  });

  const emptyValues: ProductFormData = {
    name: "",
    description: "",
    categoryId: "",
    price: 0,
    imageUrl: null,
    imagePublicId: null,
    isFeatured: false,
    isActive: true,
    inStock: true,
    stockQuantity: null,
    optionGroups: [],
  };

  const methods = useForm<ProductFormData>({
    resolver: zodResolver(schema),
    defaultValues: isEdit && product ? buildProductValues(product) : emptyValues,
  });

  useEffect(() => {
    if (isEdit) return;
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) methods.reset(JSON.parse(draft) as ProductFormData);
    } catch {
      // ignorar
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = methods;

  const imageUrl = watch("imageUrl");
  const isActive = watch("isActive");
  const isFeatured = watch("isFeatured");
  const inStock = watch("inStock");
  const stockQuantity = watch("stockQuantity");
  const isQuantityControlled = stockQuantity !== null;
  const categoryId = watch("categoryId");

  const selectedCategory = categories?.find((c) => c.id === categoryId);
  const isGroupPriced = selectedCategory?.isGroupPricingEnabled === true;

  const originalCategoryId = isEdit ? (product?.categoryId || product?.category?.id) : null;
  const originalCategory = categories?.find((c) => c.id === originalCategoryId);
  const showPriceInheritedWarning =
    isEdit &&
    originalCategory?.isGroupPricingEnabled === true &&
    !isGroupPriced &&
    categoryId !== originalCategoryId;

  useEffect(() => {
    if (isGroupPriced && selectedCategory?.groupPrice != null) {
      setValue("price", fromCents(selectedCategory.groupPrice), { shouldDirty: false });
    }
  }, [isGroupPriced, selectedCategory?.groupPrice, setValue]);

  // Autosave en localStorage cada 30s (solo para nuevo producto)
  const saveToLocalStorage = useCallback(() => {
    if (!isEdit) {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(getValues()));
        setSaveIndicator("saved");
        setTimeout(() => setSaveIndicator("idle"), 2000);
      } catch {
        // ignorar cuota excedida
      }
    }
  }, [isEdit, getValues]);

  useEffect(() => {
    if (isEdit) return;
    autosaveRef.current = setInterval(saveToLocalStorage, AUTOSAVE_MS);
    return () => {
      if (autosaveRef.current) clearInterval(autosaveRef.current);
    };
  }, [isEdit, saveToLocalStorage]);

  const onSubmit = async (values: ProductFormData) => {
    const payload = {
      ...values,
      description: values.description || null,
      price: tosCents(values.price),
      optionGroups: values.optionGroups.map((og, i) => ({
        ...og,
        order: i,
        items: og.items.map((it, j) => ({ ...it, order: j })),
      })),
    };

    try {
      if (isEdit && product) {
        await updateMutation.mutateAsync({ id: product.id, ...payload });
        toast.success("Producto actualizado");
      } else {
        await createMutation.mutateAsync(payload);
        localStorage.removeItem(DRAFT_KEY);
        toast.success("Producto creado");
      }
      router.push("/admin/catalog/products");
    } catch {
      toast.error("Error al guardar el producto");
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending || isImageUploading;

  return (
    <FormProvider {...methods}>
      <div className="pb-24">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            {isEdit ? "Editar producto" : "Nuevo producto"}
          </h1>
          {!isEdit && saveIndicator === "saved" && (
            <p className="text-xs text-muted-foreground mt-1">✓ Borrador guardado</p>
          )}
        </div>

        <form noValidate onSubmit={handleSubmit(onSubmit, (err) => console.log("Form Errors:", err))}>
          {/* Sección 1: Información básica */}
          <section className="rounded-xl border border-border p-6 mb-6 space-y-5">
            <h2 className="font-semibold text-lg">Información básica</h2>

            <div className="space-y-1.5">
              <Label htmlFor="p-name">Nombre *</Label>
              <Input
                id="p-name"
                {...register("name")}
                placeholder="Ej. Hamburguesa clásica"
                aria-invalid={!!errors.name}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="p-desc">Descripción</Label>
              <textarea
                id="p-desc"
                {...register("description")}
                placeholder="Descripción del producto (opcional)"
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="p-category">Categoría *</Label>
              <Controller
                name="categoryId"
                control={methods.control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!categories}
                  >
                    <SelectTrigger id="p-category" aria-invalid={!!errors.categoryId}>
                      <SelectValue placeholder="Seleccioná una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.categoryId && (
                <p className="text-sm text-destructive">{errors.categoryId.message}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="p-featured"
                checked={isFeatured}
                onCheckedChange={(v) =>
                  setValue("isFeatured", v === true, { shouldDirty: true })
                }
              />
              <Label htmlFor="p-featured">Destacar en la tienda</Label>
            </div>
          </section>

          {/* Sección 2: Imagen */}
          <section className="rounded-xl border border-border p-6 mb-6 space-y-4">
            <h2 className="font-semibold text-lg">Imagen del producto</h2>
            <ImageUploader
              value={imageUrl ?? undefined}
              onChange={(url) => setValue("imageUrl", url, { shouldDirty: true })}
              onRemove={() => {
                setValue("imageUrl", null, { shouldDirty: true });
                setValue("imagePublicId", null, { shouldDirty: true });
              }}
              onPublicIdChange={(pid) => setValue("imagePublicId", pid, { shouldDirty: true })}
              onUploadingChange={setIsImageUploading}
            />
          </section>

          {/* Sección 3: Precio */}
          <section className="rounded-xl border border-border p-6 mb-6 space-y-4">
            <h2 className="font-semibold text-lg">Precio</h2>

            {isGroupPriced && selectedCategory?.groupPrice != null && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
                El precio está fijado por la categoría <strong>{selectedCategory.name}</strong>:{" "}
                <strong>{formatCurrency(selectedCategory.groupPrice)}</strong>. Para cambiarlo, editá el precio grupal de la categoría.
              </div>
            )}

            {showPriceInheritedWarning && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                Este producto conserva el precio de su categoría anterior. Revisá si debés actualizarlo.
              </div>
            )}

            <div className="space-y-1.5 max-w-xs">
              <Label htmlFor="p-price">Precio (en pesos) {!isGroupPriced && "*"}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                  $
                </span>
                <Controller
                  control={methods.control}
                  name="price"
                  render={({ field }) => (
                    <PriceInput
                      id="p-price"
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isGroupPriced}
                      aria-invalid={!!errors.price}
                    />
                  )}
                />
              </div>
              {errors.price && (
                <p className="text-sm text-destructive">{errors.price.message}</p>
              )}
            </div>
          </section>

          {/* Sección 4: Variantes — solo en modo retail */}
          {!isServices && (
            <section className="rounded-xl border border-border p-6 mb-6 space-y-4">
              <div>
                <h2 className="font-semibold text-lg">Variantes y opciones</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Agregá grupos de opciones (tamaños, extras, bebidas, etc.)
                </p>
              </div>
              <OptionGroupEditor />
            </section>
          )}

          {/* Sección 5: Estado */}
          <section className="rounded-xl border border-border p-6 mb-6 space-y-4">
            <h2 className="font-semibold">{isServices ? "Publicar servicio" : "Publicar producto"}</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Visible en la tienda</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isServices ? "Los servicios inactivos no se muestran en la tienda." : "Los productos inactivos no se muestran en la carta."}
                </p>
              </div>
              <Switch
                id="p-active"
                checked={isActive}
                onCheckedChange={(v) => setValue("isActive", v, { shouldDirty: true })}
              />
            </div>
            {!isQuantityControlled && (
              <div className="flex items-center justify-between border-t border-border pt-4">
                <div>
                  <p className="text-sm font-medium">{isServices ? "Disponible" : "Disponible (en stock)"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isServices
                      ? "Si está desactivado, el servicio se muestra como no disponible."
                      : "Si está desactivado, el producto se muestra con la etiqueta \"Sin stock\" y no se puede comprar."}
                  </p>
                </div>
                <Switch
                  id="p-instock"
                  checked={inStock}
                  onCheckedChange={(v) => setValue("inStock", v, { shouldDirty: true })}
                />
              </div>
            )}
          </section>

          {/* Sección 6: Control de stock por cantidad — solo en modo retail */}
          {!isServices && (
            <section className="rounded-xl border border-border p-6 mb-6 space-y-4">
              <h2 className="font-semibold">Control de stock</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Controlar por cantidad</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    El sistema descuenta automáticamente unidades al recibir pedidos.
                  </p>
                </div>
                <Switch
                  id="p-stock-controlled"
                  checked={isQuantityControlled}
                  onCheckedChange={(v) => {
                    if (v) {
                      setValue("stockQuantity", 0, { shouldDirty: true });
                      setValue("inStock", false, { shouldDirty: true });
                    } else {
                      setValue("stockQuantity", null, { shouldDirty: true });
                      setValue("inStock", true, { shouldDirty: true });
                    }
                  }}
                />
              </div>
              {isQuantityControlled && (
                <div className="border-t border-border pt-4 space-y-2">
                  <Label htmlFor="p-stock-qty">Cantidad inicial en stock</Label>
                  <Input
                    id="p-stock-qty"
                    type="number"
                    min={0}
                    step={1}
                    className="w-36"
                    placeholder="0"
                    {...register("stockQuantity", {
                      setValueAs: (v) =>
                        v === "" || v === null || v === undefined
                          ? null
                          : Number.isNaN(Number(v))
                          ? null
                          : parseInt(v as string, 10),
                    })}
                  />
                  {errors.stockQuantity && (
                    <p className="text-sm text-destructive">{errors.stockQuantity.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    La disponibilidad se deriva automáticamente de la cantidad.
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Sticky footer */}
          <div className="fixed bottom-0 left-0 right-0 z-[60] border-t border-border bg-background/95 backdrop-blur-sm px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-4">
            <div className="max-w-6xl mx-auto flex items-center justify-center md:justify-between gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/catalog/products")}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isImageUploading
                  ? "Esperando imagen..."
                  : createMutation.isPending || updateMutation.isPending
                  ? "Guardando..."
                  : isEdit
                  ? "Guardar cambios"
                  : "Crear producto"}
              </Button>
            </div>
          </div>
        </form>

        {Object.keys(methods.formState.errors).length > 0 && (
          <div className="mt-8 p-4 bg-destructive/10 rounded-lg text-destructive text-sm font-mono overflow-auto max-w-full">
            DEBUG ERRORS:
            <pre>{JSON.stringify(methods.formState.errors, null, 2)}</pre>
          </div>
        )}
      </div>
    </FormProvider>
  );
}
