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
import { ImageUploader } from "@/components/shared/image-uploader";
import { useCreateCategory, useUpdateCategory } from "@/lib/hooks/admin/use-categories";
import { toast } from "@/components/shared/toast";
import type { Category } from "@/lib/types/catalog";

const schema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(255),
  imageUrl: z.string().nullable().optional(),
  isActive: z.boolean(),
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
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: category?.name ?? "",
        imageUrl: category?.imageUrl ?? null,
        isActive: category?.isActive ?? true,
      });
    }
  }, [open, category, reset]);

  const imageUrl = watch("imageUrl");
  const isActive = watch("isActive");

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEdit && category) {
        await updateMutation.mutateAsync({ id: category.id, ...values });
        toast.success("Categoría actualizada");
      } else {
        await createMutation.mutateAsync(values);
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

          <div className="space-y-1.5">
            <Label>Imagen</Label>
            <ImageUploader
              value={imageUrl ?? undefined}
              onChange={(url) => setValue("imageUrl", url, { shouldDirty: true })}
              onRemove={() => setValue("imageUrl", null, { shouldDirty: true })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="cat-active">Categoría activa</Label>
            <Switch
              id="cat-active"
              checked={isActive}
              onCheckedChange={(v) => setValue("isActive", v, { shouldDirty: true })}
            />
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
