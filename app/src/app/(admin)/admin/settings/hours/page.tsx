"use client";

import { SkeletonLoader } from "@/components/shared/skeleton-loader";
import { HoursEditor } from "@/components/admin/hours-editor";
import { useStoreSettings, useUpdateStoreSettings } from "@/lib/hooks/admin/use-store-settings";
import { toast } from "@/components/shared/toast";
import type { DaySchedule } from "@/lib/types/store-settings";

export default function SettingsHoursPage() {
  const { data: settings, isLoading } = useStoreSettings();
  const updateMutation = useUpdateStoreSettings();

  const handleSubmit = async (schedule: DaySchedule[]) => {
    try {
      await updateMutation.mutateAsync({ schedule });
      toast.success("Horarios guardados");
    } catch {
      toast.error("Error al guardar los horarios");
    }
  };

  if (isLoading) return <SkeletonLoader rows={7} columns={1} />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-lg">Horarios de atención</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configurá los días y horarios en que tu tienda está abierta.
          Podés configurar hasta 2 turnos por día.
        </p>
      </div>
      <HoursEditor
        value={settings?.schedule ?? null}
        onSubmit={handleSubmit}
        isPending={updateMutation.isPending}
      />
    </div>
  );
}
