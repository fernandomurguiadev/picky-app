"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiBff } from "@/lib/api/axios";
import { useAuthStore } from "@/lib/stores/auth.store";
import { toast } from "@/components/shared/toast";

export interface SimpleTenant {
  id: string;
  name: string;
  slug: string;
}

export function useMyTenants() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ["admin", "my-tenants"],
    enabled: isAuthenticated,
    queryFn: async () => {
      // Las respuestas del BFF vienen envueltas en { data: [...] }
      const { data } = await apiBff.get<{ data: SimpleTenant[] }>("/auth/me/tenants");
      return data.data || [];
    },
  });
}

export function useSwitchTenant() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);
  const role = useAuthStore((s) => s.role);

  return useMutation({
    mutationFn: async (tenantId: string) => {
      const { data } = await apiBff.post<{ access_token: string }>("/auth/switch-tenant", {
        tenantId,
      });
      return { access_token: data.access_token, tenantId };
    },
    onSuccess: (data) => {
      // 1. Actualizar el Auth Store local con el nuevo token y tenantId
      setAuth({
        accessToken: data.access_token,
        tenantId: data.tenantId,
        role: role || "ADMIN", // Preservar rol del store
      });

      // 2. Limpiar la caché entera de react-query para evitar fugas de datos entre inquilinos
      queryClient.clear();

      toast.success("Cambiando de comercio...", "Cargando panel de control...");
      
      // 3. Forzar redirección limpia al dashboard y recarga completa para impactar RLS
      setTimeout(() => {
        window.location.href = "/admin/dashboard";
      }, 1000);
    },
    onError: () => {
      toast.error("No pudimos cambiar de comercio en este momento.");
    },
  });
}
