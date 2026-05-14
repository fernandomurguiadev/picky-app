"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiBff } from "@/lib/api/axios";
import type { Category } from "@/lib/types/catalog";

// ── Query keys ───────────────────────────────────────────────────────────────

export const categoryKeys = {
  all: ["admin", "categories"] as const,
  list: () => [...categoryKeys.all, "list"] as const,
};

// ── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchCategories(): Promise<Category[]> {
  const { data } = await apiBff.get<{ data: Category[] }>("/admin/categories");
  return data.data;
}

// ── Hooks ────────────────────────────────────────────────────────────────────

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: fetchCategories,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { name: string; imageUrl?: string | null; isActive?: boolean }) =>
      apiBff.post<{ data: Category }>("/admin/categories", dto).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.list() }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...dto
    }: { id: string; name?: string; imageUrl?: string | null; isActive?: boolean }) =>
      apiBff.put<{ data: Category }>(`/admin/categories/${id}`, dto).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.list() }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiBff.delete(`/admin/categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryKeys.list() }),
  });
}

export function useReorderCategories() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) =>
      apiBff.patch("/admin/categories/reorder", { orderedIds }),
    onMutate: async (orderedIds) => {
      await qc.cancelQueries({ queryKey: categoryKeys.list() });
      const prev = qc.getQueryData<Category[]>(categoryKeys.list());
      if (prev) {
        const reordered = orderedIds
          .map((id, idx) => {
            const cat = prev.find((c) => c.id === id);
            return cat ? { ...cat, order: idx } : null;
          })
          .filter(Boolean) as Category[];
        qc.setQueryData(categoryKeys.list(), reordered);
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(categoryKeys.list(), ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: categoryKeys.list() }),
  });
}
