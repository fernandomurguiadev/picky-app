"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiBffPlatform } from "@/lib/api/platform";

type AuditAction =
  | "TENANT_CREATED"
  | "TENANT_SUSPENDED"
  | "TENANT_REACTIVATED"
  | "TENANT_PLAN_CHANGED"
  | "IMPERSONATION_STARTED"
  | "IMPERSONATION_ENDED"
  | "IMPERSONATION_PRODUCT_CREATED"
  | "IMPERSONATION_PRODUCT_UPDATED"
  | "IMPERSONATION_PRODUCT_DELETED"
  | "IMPERSONATION_CATEGORY_CREATED"
  | "IMPERSONATION_CATEGORY_UPDATED"
  | "IMPERSONATION_CATEGORY_DELETED"
  | "PLATFORM_LOGIN"
  | "PLATFORM_LOGIN_FAILED"
  | "PLATFORM_LOGOUT";

interface AuditLog {
  id: string;
  actorId: string;
  action: AuditAction;
  onBehalfOfTenantId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

const ACTION_COLORS: Partial<Record<AuditAction, string>> = {
  TENANT_SUSPENDED: "text-red-700",
  PLATFORM_LOGIN_FAILED: "text-red-700",
  TENANT_REACTIVATED: "text-green-700",
  PLATFORM_LOGIN: "text-blue-700",
  IMPERSONATION_STARTED: "text-amber-700",
  IMPERSONATION_ENDED: "text-amber-600",
};

const ALL_ACTIONS: AuditAction[] = [
  "TENANT_CREATED",
  "TENANT_SUSPENDED",
  "TENANT_REACTIVATED",
  "TENANT_PLAN_CHANGED",
  "IMPERSONATION_STARTED",
  "IMPERSONATION_ENDED",
  "IMPERSONATION_PRODUCT_CREATED",
  "IMPERSONATION_PRODUCT_UPDATED",
  "IMPERSONATION_PRODUCT_DELETED",
  "IMPERSONATION_CATEGORY_CREATED",
  "IMPERSONATION_CATEGORY_UPDATED",
  "IMPERSONATION_CATEGORY_DELETED",
  "PLATFORM_LOGIN",
  "PLATFORM_LOGIN_FAILED",
  "PLATFORM_LOGOUT",
];

export default function AuditLogsPage() {
  const [action, setAction] = useState<AuditAction | "">("");
  const [tenantId, setTenantId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<PaginatedResponse<AuditLog>>({
    queryKey: ["platform-audit-logs", action, tenantId, dateFrom, dateTo, page],
    queryFn: () =>
      apiBffPlatform
        .get<PaginatedResponse<AuditLog>>("/audit-logs", {
          params: {
            action: action || undefined,
            tenantId: tenantId || undefined,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
            page,
            limit: 50,
          },
        })
        .then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  const logs = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Auditoría</h1>
        <span className="text-sm text-muted-foreground">
          {meta?.total ?? 0} registros
        </span>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select
          value={action}
          onChange={(e) => { setAction(e.target.value as AuditAction | ""); setPage(1); }}
          className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
        >
          <option value="">Todas las acciones</option>
          {ALL_ACTIONS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>

        <input
          placeholder="Tenant ID…"
          value={tenantId}
          onChange={(e) => { setTenantId(e.target.value); setPage(1); }}
          className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm w-72"
        />

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
          className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
        />
        <span className="self-center text-sm text-muted-foreground">→</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
          className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
        />

        {(action || tenantId || dateFrom || dateTo) && (
          <button
            onClick={() => {
              setAction("");
              setTenantId("");
              setDateFrom("");
              setDateTo("");
              setPage(1);
            }}
            className="h-9 px-3 rounded border text-sm hover:bg-muted text-muted-foreground"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Fecha</th>
              <th className="text-left px-4 py-3 font-medium">Acción</th>
              <th className="text-left px-4 py-3 font-medium">Actor</th>
              <th className="text-left px-4 py-3 font-medium">Tenant</th>
              <th className="text-left px-4 py-3 font-medium">IP</th>
              <th className="text-left px-4 py-3 font-medium">Detalles</th>
            </tr>
          </thead>
          <tbody className="divide-y font-mono">
            {isLoading &&
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-4 py-2">
                    <div className="h-3 bg-muted animate-pulse rounded" />
                  </td>
                </tr>
              ))}

            {!isLoading && logs.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-muted-foreground font-sans"
                >
                  No hay registros de auditoría
                </td>
              </tr>
            )}

            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-muted/20 text-xs">
                <td className="px-4 py-2 whitespace-nowrap text-muted-foreground">
                  {new Date(log.createdAt).toLocaleString("es-AR")}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <span className={ACTION_COLORS[log.action] ?? ""}>
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-2 text-muted-foreground truncate max-w-24">
                  {log.actorId}
                </td>
                <td className="px-4 py-2 text-muted-foreground truncate max-w-24">
                  {log.onBehalfOfTenantId ?? "—"}
                </td>
                <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">
                  {log.ipAddress ?? "—"}
                </td>
                <td className="px-4 py-2 text-muted-foreground max-w-48 truncate">
                  {log.details ? JSON.stringify(log.details) : "—"}
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
