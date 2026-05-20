"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiBff } from "@/lib/api/axios";
import { useAuthStore } from "@/lib/stores/auth.store";
import type { StoreSettings } from "@/lib/types/store-settings";

export const settingsKeys = {
  all: ["admin", "settings"] as const,
  detail: () => [...settingsKeys.all, "detail"] as const,
};

export function useStoreSettings() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: settingsKeys.detail(),
    enabled: isAuthenticated,
    queryFn: async () => {
      const { data } = await apiBff.get<{ data: StoreSettings }>("/stores/me/settings");
      return data.data;
    },
  });
}

export function useUpdateStoreSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Partial<StoreSettings>) =>
      apiBff.patch<{ data: StoreSettings }>("/stores/me", dto).then((r) => r.data.data),
    onSuccess: (data) => {
      qc.setQueryData(settingsKeys.detail(), data);
    },
  });
}

export function useToggleStoreStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (isManualOpen: boolean | null) =>
      apiBff.patch<{ data: StoreSettings }>("/stores/me/status", { isManualOpen }).then((r) => r.data.data),
    onSuccess: (data) => {
      qc.setQueryData(settingsKeys.detail(), data);
    },
  });
}
