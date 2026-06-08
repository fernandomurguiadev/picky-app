"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SkeletonLoader } from "@/components/shared/skeleton-loader";
import { useStoreSettings, useUpdateStoreSettings } from "@/lib/hooks/admin/use-store-settings";
import { toast } from "@/components/shared/toast";
import { ShoppingCart, MessageCircle } from "lucide-react";

const schema = z.object({
  storeType: z.enum(["retail", "services"]),
  customCtaText: z.string().max(30).nullable(),
});

type FormValues = z.infer<typeof schema>;

export default function BusinessModelPage() {
  const { data: settings, isLoading } = useStoreSettings();
  const updateMutation = useUpdateStoreSettings();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { storeType: "retail", customCtaText: null },
  });

  useEffect(() => {
    if (settings) {
      reset({
        storeType: settings.storeType ?? "retail",
        customCtaText: settings.customCtaText ?? null,
      });
    }
  }, [settings, reset]);

  const storeType = watch("storeType");

  const onSubmit = async (values: FormValues) => {
    try {
      await updateMutation.mutateAsync({
        storeType: values.storeType,
        customCtaText: values.storeType === "services" ? (values.customCtaText || null) : null,
      });
      toast.success("Modelo de negocio actualizado");
    } catch {
      toast.error("Error al guardar");
    }
  };

  if (isLoading) return <SkeletonLoader rows={4} columns={1} />;

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <section className="rounded-xl border border-border p-6 space-y-5 bg-card">
        <div>
          <h2 className="font-semibold text-base">Tipo de tienda</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Definí cómo opera tu negocio. Esto cambia la experiencia completa de tu tienda.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setValue("storeType", "retail", { shouldDirty: true })}
            className={`flex flex-col gap-3 rounded-xl border-2 p-5 text-left transition-all ${
              storeType === "retail"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-border/80 hover:bg-muted/40"
            }`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${storeType === "retail" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">Retail / Productos</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Carrito de compras, variantes, checkout completo.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setValue("storeType", "services", { shouldDirty: true })}
            className={`flex flex-col gap-3 rounded-xl border-2 p-5 text-left transition-all ${
              storeType === "services"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-border/80 hover:bg-muted/40"
            }`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${storeType === "services" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">Servicios</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sin carrito. Los clientes consultan directo por WhatsApp.
              </p>
            </div>
          </button>
        </div>

        <input type="hidden" {...register("storeType")} />
      </section>

      {storeType === "services" && (
        <section className="rounded-xl border border-border p-6 space-y-4 bg-card">
          <div>
            <h2 className="font-semibold text-base">Texto del botón de acción</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Reemplaza "Agregar al carrito" en toda la tienda. Máx. 30 caracteres.
            </p>
          </div>
          <div className="space-y-1.5 max-w-xs">
            <Label htmlFor="cta-text">Texto del CTA</Label>
            <Input
              id="cta-text"
              {...register("customCtaText")}
              placeholder="Consultar, Pedir Turno..."
              maxLength={30}
              className="rounded-lg"
            />
          </div>
        </section>
      )}

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
  );
}
