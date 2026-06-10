"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiBffPlatform } from "@/lib/api/platform";
import { toast } from "sonner";

interface Plan {
  id: string;
  name: string;
  maxProducts: number;
  maxCategories: number;
  maxStaffUsers: number;
  maxImages: number;
  isHidden: boolean;
}

function limitLabel(n: number) {
  return n === -1 ? "∞" : String(n);
}

function PlanForm({
  initial,
  onSave,
  onCancel,
  loading,
}: {
  initial: Partial<Plan>;
  onSave: (data: Partial<Plan>) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState({
    name: initial.name ?? "",
    maxProducts: initial.maxProducts ?? 10,
    maxCategories: initial.maxCategories ?? 3,
    maxStaffUsers: initial.maxStaffUsers ?? 1,
    maxImages: initial.maxImages ?? 10,
  });

  function field(key: keyof typeof form) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((f) => ({
          ...f,
          [key]:
            key === "name" ? e.target.value : parseInt(e.target.value, 10),
        })),
    };
  }

  return (
    <div className="space-y-3 py-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1">
          <label className="text-xs font-medium">Nombre</label>
          <input
            {...field("name")}
            className="flex h-8 w-full rounded border border-input bg-background px-2 py-1 text-sm"
          />
        </div>
        {(
          [
            ["maxProducts", "Máx. productos"],
            ["maxCategories", "Máx. categorías"],
            ["maxStaffUsers", "Máx. staff"],
            ["maxImages", "Máx. imágenes"],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="space-y-1">
            <label className="text-xs font-medium">{label} (-1 = ∞)</label>
            <input
              type="number"
              min={-1}
              {...field(key)}
              className="flex h-8 w-full rounded border border-input bg-background px-2 py-1 text-sm"
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="h-8 px-3 rounded border text-sm hover:bg-muted"
        >
          Cancelar
        </button>
        <button
          disabled={loading || !form.name}
          onClick={() => onSave(form)}
          className="h-8 px-3 rounded bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </div>
  );
}

export default function PlansPage() {
  const qc = useQueryClient();
  const [creatingNew, setCreatingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ["platform-plans"],
    queryFn: () => apiBffPlatform.get<{ data: Plan[] }>("/plans").then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Plan>) => apiBffPlatform.post("/plans", data),
    onSuccess: () => {
      toast.success("Plan creado");
      setCreatingNew(false);
      void qc.invalidateQueries({ queryKey: ["platform-plans"] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Error al crear plan";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Plan> }) =>
      apiBffPlatform.patch(`/plans/${id}`, data),
    onSuccess: () => {
      toast.success("Plan actualizado");
      setEditingId(null);
      void qc.invalidateQueries({ queryKey: ["platform-plans"] });
    },
    onError: () => toast.error("Error al actualizar plan"),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => apiBffPlatform.patch(`/plans/${id}/visibility`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["platform-plans"] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Error al cambiar visibilidad";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Planes</h1>
        {!creatingNew && (
          <button
            onClick={() => setCreatingNew(true)}
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
          >
            + Nuevo plan
          </button>
        )}
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Nombre</th>
              <th className="text-center px-3 py-3 font-medium">Productos</th>
              <th className="text-center px-3 py-3 font-medium">Categorías</th>
              <th className="text-center px-3 py-3 font-medium">Staff</th>
              <th className="text-center px-3 py-3 font-medium">Imágenes</th>
              <th className="text-center px-3 py-3 font-medium">Visible</th>
              <th className="text-right px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {/* New plan form row */}
            {creatingNew && (
              <tr>
                <td colSpan={7} className="px-4">
                  <PlanForm
                    initial={{}}
                    onSave={(data) => createMutation.mutate(data)}
                    onCancel={() => setCreatingNew(false)}
                    loading={createMutation.isPending}
                  />
                </td>
              </tr>
            )}

            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={7} className="px-4 py-3">
                    <div className="h-4 bg-muted animate-pulse rounded" />
                  </td>
                </tr>
              ))}

            {plans.map((plan) => (
              <React.Fragment key={plan.id}>
                <tr
                  className={`hover:bg-muted/30 transition-colors ${plan.isHidden ? "opacity-50" : ""}`}
                >
                  <td className="px-4 py-3 font-medium">{plan.name}</td>
                  <td className="px-3 py-3 text-center">{limitLabel(plan.maxProducts)}</td>
                  <td className="px-3 py-3 text-center">{limitLabel(plan.maxCategories)}</td>
                  <td className="px-3 py-3 text-center">{limitLabel(plan.maxStaffUsers)}</td>
                  <td className="px-3 py-3 text-center">{limitLabel(plan.maxImages)}</td>
                  <td className="px-3 py-3 text-center">
                    <button
                      disabled={toggleMutation.isPending}
                      onClick={() => toggleMutation.mutate(plan.id)}
                      className={`text-xs font-medium ${plan.isHidden ? "text-muted-foreground hover:text-foreground" : "text-green-700 hover:text-green-900"}`}
                    >
                      {plan.isHidden ? "Oculto" : "Visible"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() =>
                        setEditingId(editingId === plan.id ? null : plan.id)
                      }
                      className="text-xs text-primary hover:underline"
                    >
                      {editingId === plan.id ? "Cancelar" : "Editar"}
                    </button>
                  </td>
                </tr>
                {editingId === plan.id && (
                  <tr key={`${plan.id}-edit`}>
                    <td colSpan={7} className="px-4 bg-muted/20">
                      <PlanForm
                        initial={plan}
                        onSave={(data) =>
                          updateMutation.mutate({ id: plan.id, data })
                        }
                        onCancel={() => setEditingId(null)}
                        loading={updateMutation.isPending}
                      />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
