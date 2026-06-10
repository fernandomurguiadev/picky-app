"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiBffPlatform } from "@/lib/api/platform";
import { toast } from "sonner";

const MERCHANT_ORIGIN =
  process.env.NEXT_PUBLIC_MERCHANT_ORIGIN ?? "http://picky.localhost:3000";

type TenantStatus = "active" | "suspended" | "inactive";

interface Plan {
  id: string;
  name: string;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: TenantStatus;
  plan: Plan | null;
  planGraceUntil: string | null;
  suspensionReason: string | null;
  createdAt: string;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

const STATUS_LABELS: Record<TenantStatus, string> = {
  active: "Activo",
  suspended: "Suspendido",
  inactive: "Inactivo",
};

const STATUS_COLORS: Record<TenantStatus, string> = {
  active: "bg-green-100 text-green-800",
  suspended: "bg-red-100 text-red-800",
  inactive: "bg-gray-100 text-gray-700",
};

export default function TenantsPage() {
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TenantStatus | "">("");
  const [page, setPage] = useState(1);

  const [suspendingId, setSuspendingId] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [changingPlanId, setChangingPlanId] = useState<string | null>(null);
  const [newPlanId, setNewPlanId] = useState("");

  const { data, isLoading } = useQuery<PaginatedResponse<Tenant>>({
    queryKey: ["platform-tenants", search, status, page],
    queryFn: () =>
      apiBffPlatform
        .get<PaginatedResponse<Tenant>>("/tenants", {
          params: { search: search || undefined, status: status || undefined, page, limit: 20 },
        })
        .then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  const { data: plans } = useQuery<Plan[]>({
    queryKey: ["platform-plans"],
    queryFn: () =>
      apiBffPlatform.get<Plan[]>("/plans").then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiBffPlatform.post(`/tenants/${id}/suspend`, { reason }),
    onSuccess: () => {
      toast.success("Tenant suspendido");
      setSuspendingId(null);
      setSuspendReason("");
      void qc.invalidateQueries({ queryKey: ["platform-tenants"] });
    },
    onError: () => toast.error("Error al suspender tenant"),
  });

  const reactivateMutation = useMutation({
    mutationFn: (id: string) => apiBffPlatform.post(`/tenants/${id}/reactivate`),
    onSuccess: () => {
      toast.success("Tenant reactivado");
      void qc.invalidateQueries({ queryKey: ["platform-tenants"] });
    },
    onError: () => toast.error("Error al reactivar tenant"),
  });

  const changePlanMutation = useMutation({
    mutationFn: ({ id, planId }: { id: string; planId: string }) =>
      apiBffPlatform.patch(`/tenants/${id}/plan`, { planId }),
    onSuccess: (_, vars) => {
      toast.success("Plan actualizado");
      setChangingPlanId(null);
      setNewPlanId("");
      void qc.invalidateQueries({ queryKey: ["platform-tenants"] });
    },
    onError: () => toast.error("Error al cambiar plan"),
  });

  const impersonateMutation = useMutation({
    mutationFn: (tenantId: string) =>
      apiBffPlatform
        .post<{ data: { code: string } }>(`/impersonate/${tenantId}`)
        .then((r) => r.data.data),
    onSuccess: ({ code }) => {
      window.open(`${MERCHANT_ORIGIN}/impersonate/exchange?code=${code}`, "_blank");
    },
    onError: () => toast.error("Error al iniciar impersonación"),
  });

  const tenants = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tenants</h1>
        <span className="text-sm text-muted-foreground">
          {meta?.total ?? 0} en total
        </span>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="search"
          placeholder="Buscar por nombre o slug…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm w-64 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value as TenantStatus | ""); setPage(1); }}
          className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="suspended">Suspendido</option>
          <option value="inactive">Inactivo</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Nombre / Slug</th>
              <th className="text-left px-4 py-3 font-medium">Plan</th>
              <th className="text-left px-4 py-3 font-medium">Estado</th>
              <th className="text-left px-4 py-3 font-medium">Creado</th>
              <th className="text-right px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={5} className="px-4 py-3">
                    <div className="h-4 bg-muted animate-pulse rounded" />
                  </td>
                </tr>
              ))}
            {!isLoading && tenants.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No hay tenants que coincidan
                </td>
              </tr>
            )}
            {tenants.map((t) => (
              <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.slug}</p>
                </td>
                <td className="px-4 py-3">
                  {changingPlanId === t.id ? (
                    <div className="flex gap-2 items-center">
                      <select
                        value={newPlanId}
                        onChange={(e) => setNewPlanId(e.target.value)}
                        className="h-8 rounded border border-input bg-background px-2 text-xs"
                      >
                        <option value="">Seleccionar plan</option>
                        {plans?.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <button
                        disabled={!newPlanId || changePlanMutation.isPending}
                        onClick={() =>
                          changePlanMutation.mutate({ id: t.id, planId: newPlanId })
                        }
                        className="h-8 px-2 rounded bg-primary text-primary-foreground text-xs hover:bg-primary/90 disabled:opacity-50"
                      >
                        OK
                      </button>
                      <button
                        onClick={() => { setChangingPlanId(null); setNewPlanId(""); }}
                        className="h-8 px-2 rounded bg-muted text-xs hover:bg-muted/80"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setChangingPlanId(t.id); setNewPlanId(t.plan?.id ?? ""); }}
                      className="text-xs underline text-muted-foreground hover:text-foreground"
                    >
                      {t.plan?.name ?? "Sin plan"}
                      {t.planGraceUntil && new Date(t.planGraceUntil) > new Date() && (
                        <span className="ml-1 text-amber-600">(gracia)</span>
                      )}
                    </button>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[t.status]}`}
                  >
                    {STATUS_LABELS[t.status]}
                  </span>
                  {t.suspensionReason && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-40" title={t.suspensionReason}>
                      {t.suspensionReason}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(t.createdAt).toLocaleDateString("es-AR")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end items-start">
                    {/* Suspend / Reactivate */}
                    {t.status === "active" ? (
                      suspendingId === t.id ? (
                        <div className="flex gap-1 items-center">
                          <input
                            placeholder="Motivo (opcional)"
                            value={suspendReason}
                            onChange={(e) => setSuspendReason(e.target.value)}
                            className="h-7 rounded border border-input bg-background px-2 text-xs w-36"
                          />
                          <button
                            disabled={suspendMutation.isPending}
                            onClick={() =>
                              suspendMutation.mutate({ id: t.id, reason: suspendReason })
                            }
                            className="h-7 px-2 rounded bg-destructive text-destructive-foreground text-xs hover:bg-destructive/90 disabled:opacity-50"
                          >
                            Suspender
                          </button>
                          <button
                            onClick={() => { setSuspendingId(null); setSuspendReason(""); }}
                            className="h-7 px-2 rounded bg-muted text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSuspendingId(t.id)}
                          className="text-xs text-destructive hover:underline"
                        >
                          Suspender
                        </button>
                      )
                    ) : (
                      <button
                        disabled={reactivateMutation.isPending}
                        onClick={() => reactivateMutation.mutate(t.id)}
                        className="text-xs text-green-700 hover:underline disabled:opacity-50"
                      >
                        Reactivar
                      </button>
                    )}

                    {/* Impersonate */}
                    {t.status === "active" && (
                      <button
                        disabled={impersonateMutation.isPending}
                        onClick={() => impersonateMutation.mutate(t.id)}
                        className="text-xs text-primary hover:underline disabled:opacity-50"
                      >
                        Impersonar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="h-8 px-3 rounded border text-sm disabled:opacity-40 hover:bg-muted"
          >
            ← Anterior
          </button>
          <span className="text-sm text-muted-foreground">
            {page} / {meta.totalPages}
          </span>
          <button
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="h-8 px-3 rounded border text-sm disabled:opacity-40 hover:bg-muted"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
