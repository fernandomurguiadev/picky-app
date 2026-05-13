"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { SkeletonLoader } from "@/components/shared/skeleton-loader";
import { useStoreSettings, useUpdateStoreSettings } from "@/lib/hooks/admin/use-store-settings";
import { toast } from "@/components/shared/toast";
import { fromCents, tosCents } from "@/lib/utils";

const schema = z.object({
  deliveryEnabled: z.boolean(),
  deliveryCost: z.number().min(0),
  deliveryMinOrder: z.number().min(0),
  takeawayEnabled: z.boolean(),
  inStoreEnabled: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export default function SettingsDeliveryPage() {
  const { data: settings, isLoading } = useStoreSettings();
  const updateMutation = useUpdateStoreSettings();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      deliveryEnabled: false,
      deliveryCost: 0,
      deliveryMinOrder: 0,
      takeawayEnabled: true,
      inStoreEnabled: false,
    },
  });

  useEffect(() => {
    if (settings) {
      reset({
        deliveryEnabled: settings.deliveryEnabled,
        deliveryCost: fromCents(settings.deliveryCost),
        deliveryMinOrder: fromCents(settings.deliveryMinOrder),
        takeawayEnabled: settings.takeawayEnabled,
        inStoreEnabled: settings.inStoreEnabled,
      });
    }
  }, [settings, reset]);

  const deliveryEnabled = watch("deliveryEnabled");

  const onSubmit = async (values: FormValues) => {
    try {
      await updateMutation.mutateAsync({
        deliveryEnabled: values.deliveryEnabled,
        deliveryCost: tosCents(values.deliveryCost),
        deliveryMinOrder: tosCents(values.deliveryMinOrder),
        takeawayEnabled: values.takeawayEnabled,
        inStoreEnabled: values.inStoreEnabled,
      });
      toast.success("Configuración de entrega guardada");
    } catch {
      toast.error("Error al guardar");
    }
  };

  if (isLoading) return <SkeletonLoader rows={5} columns={1} />;

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <section className="rounded-xl border border-border p-6 space-y-5">
        <h2 className="font-semibold">Métodos de entrega</h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Delivery</p>
            <p className="text-sm text-muted-foreground">Enviás el pedido al domicilio del cliente.</p>
          </div>
          <Switch
            checked={deliveryEnabled}
            onCheckedChange={(v) => setValue("deliveryEnabled", v, { shouldDirty: true })}
          />
        </div>

        {deliveryEnabled && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-4 border-l-2 border-primary/30">
            <div className="space-y-1.5">
              <Label htmlFor="del-cost">Costo de envío ($)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">$</span>
                <Input
                  id="del-cost"
                  type="number"
                  min={0}
                  className="pl-7"
                  {...register("deliveryCost", { valueAsNumber: true })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="del-min">Pedido mínimo ($)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">$</span>
                <Input
                  id="del-min"
                  type="number"
                  min={0}
                  className="pl-7"
                  {...register("deliveryMinOrder", { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>
        )}

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Takeaway / Retiro en local</p>
            <p className="text-sm text-muted-foreground">El cliente pasa a retirar el pedido.</p>
          </div>
          <Switch
            checked={watch("takeawayEnabled")}
            onCheckedChange={(v) => setValue("takeawayEnabled", v, { shouldDirty: true })}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Consumir en el local</p>
            <p className="text-sm text-muted-foreground">El cliente consume en el lugar.</p>
          </div>
          <Switch
            checked={watch("inStoreEnabled")}
            onCheckedChange={(v) => setValue("inStoreEnabled", v, { shouldDirty: true })}
          />
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="submit" disabled={updateMutation.isPending || !isDirty}>
          {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
