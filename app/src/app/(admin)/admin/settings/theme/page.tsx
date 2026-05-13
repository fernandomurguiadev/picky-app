"use client";

import { SkeletonLoader } from "@/components/shared/skeleton-loader";
import { ThemeEditor } from "@/components/admin/theme-editor";
import { useStoreSettings, useUpdateStoreSettings } from "@/lib/hooks/admin/use-store-settings";
import { toast } from "@/components/shared/toast";

export default function SettingsThemePage() {
  const { data: settings, isLoading } = useStoreSettings();
  const updateMutation = useUpdateStoreSettings();

  const handleSubmit = async (values: {
    primaryColor: string;
    accentColor: string;
  }) => {
    try {
      await updateMutation.mutateAsync(values);
      toast.success("Tema guardado");
    } catch {
      toast.error("Error al guardar el tema");
    }
  };

  if (isLoading) return <SkeletonLoader rows={4} columns={1} />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-lg">Tema de tu tienda</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Personalizá los colores que verán tus clientes.
        </p>
      </div>
      <ThemeEditor
        value={
          settings
            ? {
                primaryColor: settings.primaryColor,
                accentColor: settings.accentColor,
              }
            : null
        }
        storeName=""
        onSubmit={handleSubmit}
        isPending={updateMutation.isPending}
      />
    </div>
  );
}
