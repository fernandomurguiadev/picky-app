"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useCreateCategory, useUpdateCategory } from "@/lib/hooks/admin/use-categories";
import { toast } from "@/components/shared/toast";
import { fromCents, tosCents } from "@/lib/utils";
import type { Category } from "@/lib/types/catalog";

const schema = z
  .object({
    name: z.string().min(1, "El nombre es requerido").max(255),
    imageUrl: z.string().nullable().optional(),
    isActive: z.boolean(),
    isGroupPricingEnabled: z.boolean(),
    groupPrice: z.number().min(0, "El precio no puede ser negativo").nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.isGroupPricingEnabled && (data.groupPrice === null || data.groupPrice === undefined)) {
      ctx.addIssue({
        code: "custom",
        message: "El precio grupal es requerido",
        path: ["groupPrice"],
      });
    }
  });

type FormValues = z.infer<typeof schema>;

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
}: CategoryFormDialogProps) {
  const isEdit = !!category;
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      imageUrl: null,
      isActive: true,
      isGroupPricingEnabled: false,
      groupPrice: null,
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: category?.name ?? "",
        imageUrl: category?.imageUrl ?? null,
        isActive: category?.isActive ?? true,
        isGroupPricingEnabled: category?.isGroupPricingEnabled ?? false,
        groupPrice: category?.groupPrice != null ? fromCents(category.groupPrice) : null,
      });
    }
  }, [open, category, reset]);

  const isActive = watch("isActive");
  const isGroupPricingEnabled = watch("isGroupPricingEnabled");

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = {
        ...values,
        groupPrice: values.isGroupPricingEnabled && values.groupPrice != null
          ? tosCents(values.groupPrice)
          : null,
      };

      if (isEdit && category) {
        const result = await updateMutation.mutateAsync({ id: category.id, ...payload });
        if (result.updatedProductsCount > 0) {
          toast.success(`Categoría actualizada. Se sincronizaron ${result.updatedProductsCount} productos.`);
        } else {
          toast.success("Categoría actualizada");
        }
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Categoría creada");
      }
      onOpenChange(false);
    } catch {
      toast.error("Error al guardar la categoría");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar categoría" : "Nueva categoría"}</DialogTitle>
        </DialogHeader>

        <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">Nombre *</Label>
            <Input
              id="cat-name"
              {...register("name")}
              placeholder="Ej. Hamburguesas"
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="cat-active">Categoría activa</Label>
            <Switch
              id="cat-active"
              checked={isActive}
              onCheckedChange={(v) => setValue("isActive", v, { shouldDirty: true })}
            />
          </div>

          <div className="rounded-lg border border-border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Precio grupal</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Fija un único precio para todos los productos de esta categoría.
                </p>
              </div>
              <Switch
                id="cat-group-pricing"
                checked={isGroupPricingEnabled}
                onCheckedChange={(v) => {
                  setValue("isGroupPricingEnabled", v, { shouldDirty: true });
                  if (!v) setValue("groupPrice", null, { shouldDirty: true });
                }}
              />
            </div>

            {isGroupPricingEnabled && (
              <div className="space-y-1.5">
                <Label htmlFor="cat-group-price">Precio (en pesos) *</Label>
                <div className="relative max-w-xs">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                    $
                  </span>
                  <Input
                    id="cat-group-price"
                    type="number"
                    min={0}
                    step={1}
                    className="pl-7"
                    placeholder="0"
                    aria-invalid={!!errors.groupPrice}
                    {...register("groupPrice", { valueAsNumber: true })}
                  />
                </div>
                {errors.groupPrice && (
                  <p className="text-sm text-destructive">{errors.groupPrice.message}</p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear categoría"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
