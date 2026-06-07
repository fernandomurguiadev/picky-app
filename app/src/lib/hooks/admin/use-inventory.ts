"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiBff } from "@/lib/api/axios";
import type { Product } from "@/lib/types/catalog";

export type StockMovementType =
  | "purchase_in"
  | "adjustment"
  | "waste"
  | "sale_out"
  | "cancellation_return";

export interface StockMovement {
  id: string;
  tenantId: string;
  productId: string;
  type: StockMovementType;
  quantity: number;
  notes: string | null;
  orderId: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface MovementsResponse {
  data: StockMovement[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateMovementDto {
  type: "purchase_in" | "adjustment" | "waste";
  quantity: number;
  notes?: string;
}

// ── Query keys ─────────────────────────────────────────────────────────────────

export const inventoryKeys = {
  all: ["admin", "inventory"] as const,
  products: () => [...inventoryKeys.all, "products"] as const,
  movements: (productId: string) =>
    [...inventoryKeys.all, "movements", productId] as const,
};

// ── Hooks ──────────────────────────────────────────────────────────────────────

export function useStockProducts() {
  return useQuery({
    queryKey: inventoryKeys.products(),
    queryFn: async () => {
      const { data } = await apiBff.get<{ data: Product[] }>("/admin/inventory/products");
      return data.data;
    },
  });
}

export function useProductMovements(productId: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: [...inventoryKeys.movements(productId), { page, limit }],
    queryFn: async () => {
      const { data } = await apiBff.get<MovementsResponse>(
        `/admin/inventory/products/${productId}/movements`,
        { params: { page, limit } }
      );
      return data;
    },
    enabled: !!productId,
  });
}

export function useCreateMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      dto,
    }: {
      productId: string;
      dto: CreateMovementDto;
    }) =>
      apiBff
        .post<{ data: StockMovement }>(
          `/admin/inventory/products/${productId}/movements`,
          dto
        )
        .then((r) => r.data.data),
    onSuccess: (_data, { productId }) => {
      qc.invalidateQueries({ queryKey: inventoryKeys.products() });
      qc.invalidateQueries({ queryKey: inventoryKeys.movements(productId) });
    },
  });
}
