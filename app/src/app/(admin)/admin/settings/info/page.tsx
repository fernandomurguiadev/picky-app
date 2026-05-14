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
import { Store, Link2, Lock } from "lucide-react";

const schema = z.object({
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

  // Construimos la URL pública basándonos en el slug del negocio (tenant)
  const storeSlug = settings?.tenant?.slug ?? "";
  const storeName = settings?.tenant?.name ?? "Cargando...";
  const publicStoreUrl = typeof window !== "undefined" 
    ? `${window.location.origin.replace(":3001", ":3000").replace(":3002", ":3000")}/s/${storeSlug}`
    : `/s/${storeSlug}`;

  return (
    <div className="space-y-6">
      {/* 🚀 SECCIÓN DE IDENTIDAD GLOBAL (LECTURA PREMIUM) */}
      <section className="rounded-xl border border-border bg-muted/30 p-6 space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wider">
          <Lock className="w-3.5 h-3.5" />
          <span>Identidad básica del negocio</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground/70">Nombre del comercio</Label>
            <div className="relative flex items-center">
              <Store className="absolute left-3 w-4 h-4 text-muted-foreground/60" />
              <Input
                value={storeName}
                disabled
                className="pl-9 bg-background border-border/60 text-foreground/80 select-all font-medium disabled:opacity-100"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground/70">Dirección web (URL)</Label>
            <div className="relative flex items-center">
              <Link2 className="absolute left-3 w-4 h-4 text-muted-foreground/60" />
              <Input
                value={storeSlug ? `/s/${storeSlug}` : ""}
                disabled
                className="pl-9 bg-background border-border/60 text-foreground/80 select-all font-mono text-sm disabled:opacity-100"
              />
              {storeSlug && (
                <a
                  href={publicStoreUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute right-2 text-xs px-2 py-1 rounded-md bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors cursor-pointer"
                >
                  Ver tienda ↗
                </a>
              )}
            </div>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          El nombre y la URL del negocio están vinculados a tu suscripción. Contactá al soporte para modificarlos.
        </p>
      </section>

      {/* FORMULARIO EDICIÓN DE METADATOS */}
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section className="rounded-xl border border-border p-6 space-y-5 bg-card">
          <h2 className="font-semibold text-base">Detalles y contacto</h2>

          <div className="space-y-1.5">
            <Label htmlFor="s-desc">Descripción</Label>
            <textarea
              id="s-desc"
              {...register("description")}
              rows={3}
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none"
              placeholder="Describí tu negocio en pocas palabras..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="s-phone">Teléfono comercial</Label>
              <Input 
                id="s-phone" 
                {...register("phone")} 
                placeholder="+54 9 11 0000-0000" 
                className="rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-whatsapp">WhatsApp para pedidos</Label>
              <Input 
                id="s-whatsapp" 
                {...register("whatsapp")} 
                placeholder="+54 9 11 0000-0000" 
                className="rounded-lg"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="s-address">Dirección física / sucursal</Label>
            <Input 
              id="s-address" 
              {...register("address")} 
              placeholder="Ej. Av. Corrientes 1234, CABA" 
              className="rounded-lg"
            />
          </div>
        </section>

        <section className="rounded-xl border border-border p-6 space-y-4 bg-card">
          <h2 className="font-semibold text-base">Logo oficial</h2>
          <p className="text-xs text-muted-foreground -mt-2">Esta imagen aparecerá en tu tienda pública y en el checkout.</p>
          <ImageUploader
            value={logoUrl ?? undefined}
            onChange={(url) => setValue("logoUrl", url, { shouldDirty: true })}
            onRemove={() => setValue("logoUrl", null, { shouldDirty: true })}
          />
        </section>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={updateMutation.isPending || !isDirty}
            className="rounded-xl px-6 shadow-sm font-medium"
          >
            {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </div>
  );
}
