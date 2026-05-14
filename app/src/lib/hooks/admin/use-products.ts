"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiBff } from "@/lib/api/axios";
import type { PaginatedResponse, Product, ProductsQueryParams } from "@/lib/types/catalog";

// ── Query keys ───────────────────────────────────────────────────────────────

export const productKeys = {
  all: ["admin", "products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (params: ProductsQueryParams) => [...productKeys.lists(), params] as const,
  detail: (id: string) => [...productKeys.all, "detail", id] as const,
};

// ── Hooks ────────────────────────────────────────────────────────────────────

export function useProducts(params: ProductsQueryParams = {}) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: async () => {
      const { data } = await apiBff.get<PaginatedResponse<Product>>("/admin/products", {
        params,
      });
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: unknown) =>
      apiBff.post<{ data: Product }>("/admin/products", dto).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.lists() }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...dto }: { id: string } & Record<string, unknown>) =>
      apiBff.put<{ data: Product }>(`/admin/products/${id}`, dto).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.lists() }),
  });
}

export function useToggleProductStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiBff.patch<{ data: Product }>(`/admin/products/${id}/status`, { isActive }).then((r) => r.data.data),
    // Optimistic update
    onMutate: async ({ id, isActive }) => {
      await qc.cancelQueries({ queryKey: productKeys.lists() });
      const snapshots: Array<{ key: readonly unknown[]; data: unknown }> = [];
      qc.getQueriesData<PaginatedResponse<Product>>({ queryKey: productKeys.lists() }).forEach(
        ([key, old]) => {
          snapshots.push({ key, data: old });
          if (old) {
            qc.setQueryData(key, {
              ...old,
              data: old.data.map((p) => (p.id === id ? { ...p, isActive } : p)),
            });
          }
        }
      );
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots.forEach(({ key, data }) => qc.setQueryData(key, data));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: productKeys.lists() }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiBff.delete(`/admin/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.lists() }),
  });
}
