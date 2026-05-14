"use client";

import { useQuery } from "@tanstack/react-query";
import { apiBff } from "@/lib/api/axios";
import type { DashboardMetrics } from "@/lib/types/dashboard";

export const dashboardKeys = {
  all: ["admin", "dashboard"] as const,
  metrics: () => [...dashboardKeys.all, "metrics"] as const,
};

export function useDashboardMetrics() {
  return useQuery({
    queryKey: dashboardKeys.metrics(),
    queryFn: async () => {
      const { data } = await apiBff.get<{
        data: { data: DashboardMetrics };
      }>("/admin/dashboard");
      
      // El interceptor global de Nest envuelve la respuesta { data } en { data: { data }, meta }
      // Por ende, extraemos data.data.data para obtener las métricas tipadas.
      return data.data.data;
    },
    refetchInterval: 30_000, // Refrescar cada 30 segundos para el admin en tiempo real
  });
}
