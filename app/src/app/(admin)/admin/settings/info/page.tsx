"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploader } from "@/components/shared/image-uploader";
import { SkeletonLoader } from "@/components/shared/skeleton-loader";
import { useStoreSettings, useUpdateStoreSettings } from "@/lib/hooks/admin/use-store-settings";
import { toast } from "@/components/shared/toast";

const schema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(255),
  description: z.string().max(2000),
  phone: z.string().max(50),
  whatsapp: z.string().max(50),
  address: z.string().max(500),
  logoUrl: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function SettingsInfoPage() {
  const { data: settings, isLoading } = useStoreSettings();
  const updateMutation = useUpdateStoreSettings();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      phone: "",
      whatsapp: "",
      address: "",
      logoUrl: null,
    },
  });

  useEffect(() => {
    if (settings) {
      reset({
        description: settings.description ?? "",
        phone: settings.phone ?? "",
        whatsapp: settings.whatsapp ?? "",
        address: settings.address ?? "",
        logoUrl: settings.logoUrl ?? null,
      });
    }
  }, [settings, reset]);

  const logoUrl = watch("logoUrl");

  const onSubmit = async (values: FormValues) => {
    try {
      await updateMutation.mutateAsync({
        description: values.description || null,
        phone: values.phone || null,
        whatsapp: values.whatsapp || null,
        address: values.address || null,
        logoUrl: values.logoUrl ?? null,
      });
      toast.success("Información guardada");
    } catch {
      toast.error("Error al guardar los datos");
    }
  };

  if (isLoading) return <SkeletonLoader rows={5} columns={1} />;

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <section className="rounded-xl border border-border p-6 space-y-5">
        <h2 className="font-semibold">Información del negocio</h2>

        <div className="space-y-1.5">
          <Label htmlFor="s-desc">Descripción</Label>
          <textarea
            id="s-desc"
            {...register("description")}
            rows={3}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none"
            placeholder="Describí tu negocio en pocas palabras..."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="s-phone">Teléfono</Label>
            <Input id="s-phone" {...register("phone")} placeholder="+54 9 11 0000-0000" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-whatsapp">WhatsApp</Label>
            <Input id="s-whatsapp" {...register("whatsapp")} placeholder="+54 9 11 0000-0000" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="s-address">Dirección</Label>
          <Input id="s-address" {...register("address")} placeholder="Ej. Av. Corrientes 1234, CABA" />
        </div>
      </section>

      <section className="rounded-xl border border-border p-6 space-y-4">
        <h2 className="font-semibold">Logo del negocio</h2>
        <ImageUploader
          value={logoUrl ?? undefined}
          onChange={(url) => setValue("logoUrl", url, { shouldDirty: true })}
          onRemove={() => setValue("logoUrl", null, { shouldDirty: true })}
        />
      </section>

      <div className="flex justify-end">
        <Button type="submit" disabled={updateMutation.isPending || !isDirty}>
          {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
