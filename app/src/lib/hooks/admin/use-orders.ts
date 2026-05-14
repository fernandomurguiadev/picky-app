"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiBff } from "@/lib/api/axios";
import type { Order, OrderStatus } from "@/lib/types/order";
import { toast } from "@/components/shared/toast";

export const ordersKeys = {
  all: ["admin", "orders"] as const,
  lists: () => [...ordersKeys.all, "list"] as const,
  list: (filters: string) => [...ordersKeys.lists(), { filters }] as const,
  details: () => [...ordersKeys.all, "detail"] as const,
  detail: (id: string) => [...ordersKeys.details(), id] as const,
};

interface FetchOrdersParams {
  status?: OrderStatus;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export function useAdminOrders(params: FetchOrdersParams = {}) {
  // Defaults para listado principal / Kanban
  const queryParams = {
    limit: params.limit ?? 100, // Cargar bastantes para el Kanban
    ...params,
  };

  return useQuery({
    queryKey: ordersKeys.list(JSON.stringify(queryParams)),
    queryFn: async () => {
      const { data } = await apiBff.get<{
        data: { data: Order[]; total: number };
      }>("/admin/orders", {
        params: queryParams,
      });
      // El interceptor global de Nest envuelve todo en { data, meta }, resultando en data.data.data
      return data.data.data;
    },
  });
}

export function useAdminOrder(id: string, enabled = true) {
  return useQuery({
    queryKey: ordersKeys.detail(id),
    queryFn: async () => {
      const { data } = await apiBff.get<{ data: Order }>(`/admin/orders/${id}`);
      return data.data;
    },
    enabled: !!id && enabled,
  });
}

export function useChangeOrderStatus() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, note }: { id: string; status: OrderStatus; note?: string }) => {
      const { data } = await apiBff.patch<{ data: Order }>(`/admin/orders/${id}/status`, {
        status,
        note,
      });
      return data.data;
    },
    onMutate: async ({ id, status }) => {
      // Cancelar queries activas para evitar sobrescrituras
      await qc.cancelQueries({ queryKey: ordersKeys.all });

      // Guardar snapshot de caché previo para rollback en caso de error
      const previousQueries = qc.getQueriesData<{ data: Order[] }>({ queryKey: ordersKeys.lists() });

      // Optimistic update en todos los listados activos
      qc.setQueriesData<Order[]>({ queryKey: ordersKeys.lists() }, (old) => {
        if (!old) return old;
        return old.map((order) =>
          order.id === id ? { ...order, status } : order
        );
      });

      return { previousQueries };
    },
    onError: (_err, _variables, context) => {
      // Rollback en caso de fallo
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, previousData]) => {
          qc.setQueryData(queryKey, previousData);
        });
      }
      toast.error("Error al actualizar el estado del pedido");
    },
    onSuccess: (updatedOrder) => {
      toast.success(`Pedido #${updatedOrder.orderNumber} actualizado`);
      // Invalida queries para revalidar con el server
      qc.invalidateQueries({ queryKey: ordersKeys.all });
    },
  });
}

export function useUpdateOrderNotes() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, internalNotes }: { id: string; internalNotes: string }) => {
      const { data } = await apiBff.patch<{ data: Order }>(`/admin/orders/${id}/notes`, {
        internalNotes,
      });
      return data.data;
    },
    onSuccess: (updatedOrder) => {
      toast.success("Notas internas actualizadas");
      // Actualiza detalle en cache directamente
      qc.setQueryData(ordersKeys.detail(updatedOrder.id), updatedOrder);
      // Invalida listados
      qc.invalidateQueries({ queryKey: ordersKeys.lists() });
    },
    onError: () => {
      toast.error("Error al actualizar notas internas");
    },
  });
}
