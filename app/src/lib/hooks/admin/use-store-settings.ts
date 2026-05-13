"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiBff } from "@/lib/api/axios";
import type { StoreSettings } from "@/lib/types/store-settings";

export const settingsKeys = {
  all: ["admin", "settings"] as const,
  detail: () => [...settingsKeys.all, "detail"] as const,
};

export function useStoreSettings() {
  return useQuery({
    queryKey: settingsKeys.detail(),
    queryFn: async () => {
      const { data } = await apiBff.get<StoreSettings>("/stores/me/settings");
      return data;
    },
  });
}

export function useUpdateStoreSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: Partial<StoreSettings>) =>
      apiBff.patch<StoreSettings>("/stores/me", dto).then((r) => r.data),
    onSuccess: (data) => {
      qc.setQueryData(settingsKeys.detail(), data);
    },
  });
}

export function useToggleStoreStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (isManualOpen: boolean | null) =>
      apiBff.patch<StoreSettings>("/stores/me/status", { isManualOpen }).then((r) => r.data),
    onSuccess: (data) => {
      qc.setQueryData(settingsKeys.detail(), data);
    },
  });
}
