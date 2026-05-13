"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
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
import { toast } from "@/components/shared/toast";
import { fromCents, tosCents } from "@/lib/utils";
import type { Product, ProductFormData } from "@/lib/types/catalog";

const DRAFT_KEY = "picky-product-draft";
const AUTOSAVE_MS = 30_000;

const schema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(255),
  description: z.string().max(2000),
  categoryId: z.string().uuid("Seleccioná una categoría"),
  price: z.number().min(0.01, "El precio debe ser mayor a 0"),
  imageUrl: z.string().nullable(),
  isFeatured: z.boolean(),
  isActive: z.boolean(),
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

  const [saveIndicator, setSaveIndicator] = useState<"idle" | "saving" | "saved">("idle");
  const autosaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const methods = useForm<ProductFormData>({
    resolver: zodResolver(schema),
    defaultValues: (() => {
      if (isEdit && product) {
        return {
          name: product.name,
          description: product.description ?? "",
          categoryId: product.categoryId,
          price: fromCents(product.price),
          imageUrl: product.imageUrl ?? null,
          isFeatured: product.isFeatured,
          isActive: product.isActive,
          optionGroups: (product.optionGroups ?? []).map((og) => ({
            id: og.id,
            name: og.name,
            type: og.type,
            isRequired: og.isRequired,
            minSelections: og.minSelections,
            maxSelections: og.maxSelections,
            order: og.order,
            items: og.items.map((it) => ({
              id: it.id,
              name: it.name,
              priceModifier: it.priceModifier,
              isDefault: it.isDefault,
              order: it.order,
            })),
          })),
        };
      }
      // Recuperar draft si existe (solo para nuevo)
      if (!isEdit) {
        try {
          const draft = localStorage.getItem(DRAFT_KEY);
          if (draft) return JSON.parse(draft) as ProductFormData;
        } catch {
          // ignorar
        }
      }
      return {
        name: "",
        description: "",
        categoryId: "",
        price: 0,
        imageUrl: null,
        isFeatured: false,
        isActive: true,
        optionGroups: [],
      };
    })(),
  });

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

  const isPending = createMutation.isPending || updateMutation.isPending;

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

        <form noValidate onSubmit={handleSubmit(onSubmit)}>
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
              <Select
                value={watch("categoryId") || ""}
                onValueChange={(v) => setValue("categoryId", v, { shouldDirty: true })}
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
              onRemove={() => setValue("imageUrl", null, { shouldDirty: true })}
            />
          </section>

          {/* Sección 3: Precio */}
          <section className="rounded-xl border border-border p-6 mb-6 space-y-4">
            <h2 className="font-semibold text-lg">Precio</h2>
            <div className="space-y-1.5 max-w-xs">
              <Label htmlFor="p-price">Precio (en pesos) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                  $
                </span>
                <Input
                  id="p-price"
                  type="number"
                  min={0}
                  step={1}
                  className="pl-7"
                  placeholder="0"
                  aria-invalid={!!errors.price}
                  {...register("price", { valueAsNumber: true })}
                />
              </div>
              {errors.price && (
                <p className="text-sm text-destructive">{errors.price.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Se guarda como {tosCents(watch("price") || 0)} centavos internamente.
              </p>
            </div>
          </section>

          {/* Sección 4: Variantes */}
          <section className="rounded-xl border border-border p-6 mb-6 space-y-4">
            <div>
              <h2 className="font-semibold text-lg">Variantes y opciones</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Agregá grupos de opciones (tamaños, extras, bebidas, etc.)
              </p>
            </div>
            <OptionGroupEditor />
          </section>

          {/* Sección 5: Estado */}
          <section className="rounded-xl border border-border p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Publicar producto</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Los productos inactivos no se muestran en la tienda.
                </p>
              </div>
              <Switch
                id="p-active"
                checked={isActive}
                onCheckedChange={(v) => setValue("isActive", v, { shouldDirty: true })}
              />
            </div>
          </section>

          {/* Sticky footer */}
          <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-border bg-background/95 backdrop-blur-sm px-6 py-4">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/catalog/products")}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear producto"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </FormProvider>
  );
}
