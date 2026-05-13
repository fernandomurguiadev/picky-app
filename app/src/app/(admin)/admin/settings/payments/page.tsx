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

const schema = z
  .object({
    cashEnabled: z.boolean(),
    transferEnabled: z.boolean(),
    transferAlias: z.string().max(100),
    cardEnabled: z.boolean(),
  })
  .refine(
    (data) => data.cashEnabled || data.transferEnabled || data.cardEnabled,
    { message: "Debe haber al menos un método de pago activo" }
  );

type FormValues = z.infer<typeof schema>;

export default function SettingsPaymentsPage() {
  const { data: settings, isLoading } = useStoreSettings();
  const updateMutation = useUpdateStoreSettings();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      cashEnabled: true,
      transferEnabled: false,
      transferAlias: "",
      cardEnabled: false,
    },
  });

  useEffect(() => {
    if (settings) {
      reset({
        cashEnabled: settings.cashEnabled,
        transferEnabled: settings.transferEnabled,
        transferAlias: settings.transferAlias ?? "",
        cardEnabled: settings.cardEnabled,
      });
    }
  }, [settings, reset]);

  const transferEnabled = watch("transferEnabled");

  const onSubmit = async (values: FormValues) => {
    try {
      await updateMutation.mutateAsync({
        cashEnabled: values.cashEnabled,
        transferEnabled: values.transferEnabled,
        transferAlias: values.transferAlias || null,
        cardEnabled: values.cardEnabled,
      });
      toast.success("Métodos de pago guardados");
    } catch {
      toast.error("Error al guardar");
    }
  };

  if (isLoading) return <SkeletonLoader rows={4} columns={1} />;

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <section className="rounded-xl border border-border p-6 space-y-5">
        <div>
          <h2 className="font-semibold">Métodos de pago aceptados</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Al menos uno debe estar activo.
          </p>
        </div>

        {errors.root && (
          <p className="text-sm text-destructive">{errors.root.message}</p>
        )}

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Efectivo</p>
            <p className="text-sm text-muted-foreground">Pago en mano al entregar.</p>
          </div>
          <Switch
            checked={watch("cashEnabled")}
            onCheckedChange={(v) => setValue("cashEnabled", v, { shouldDirty: true })}
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Transferencia bancaria</p>
            <p className="text-sm text-muted-foreground">CBU, CVU o alias de Mercado Pago.</p>
          </div>
          <Switch
            checked={transferEnabled}
            onCheckedChange={(v) => setValue("transferEnabled", v, { shouldDirty: true })}
          />
        </div>

        {transferEnabled && (
          <div className="pl-4 border-l-2 border-primary/30 space-y-1.5">
            <Label htmlFor="s-alias">Alias / CBU</Label>
            <Input
              id="s-alias"
              {...register("transferAlias")}
              placeholder="Ej. mi.negocio.mp"
            />
          </div>
        )}

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Tarjeta (débito/crédito)</p>
            <p className="text-sm text-muted-foreground">POS o terminal al momento de la entrega.</p>
          </div>
          <Switch
            checked={watch("cardEnabled")}
            onCheckedChange={(v) => setValue("cardEnabled", v, { shouldDirty: true })}
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
