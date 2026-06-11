"use client";

import React, { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiBffPlatform } from "@/lib/api/platform";
import { toast } from "sonner";
import { toCents, fromCents, formatCurrency } from "@/lib/utils/currency";

interface Plan {
  id: string;
  name: string;
  description?: string | null;
  maxProducts: number;
  maxCategories: number;
  maxStaffUsers: number;
  maxImages: number;
  priceMonthly: number;
  isHidden: boolean;
  sortOrder: number;
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
    description: initial.description ?? "",
    maxProducts: initial.maxProducts ?? 10,
    maxCategories: initial.maxCategories ?? 3,
    maxStaffUsers: initial.maxStaffUsers ?? 1,
    maxImages: initial.maxImages ?? 10,
    priceMonthly:
      initial.priceMonthly === -1
        ? "-1"
        : initial.priceMonthly
        ? fromCents(initial.priceMonthly).toString()
        : "0",
  });

  function field(key: keyof typeof form) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((f) => ({
          ...f,
          [key]:
            key === "name" || key === "description" || key === "priceMonthly"
              ? e.target.value
              : parseInt((e.target as HTMLInputElement).value, 10),
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
        <div className="col-span-2 space-y-1">
          <label className="text-xs font-medium">Descripción (se muestra en el landing)</label>
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Ej: Ideal para negocios que quieren empezar sin gastar nada."
            className="flex w-full rounded border border-input bg-background px-2 py-1 text-sm resize-none"
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
        <div className="col-span-2 space-y-1">
          <label className="text-xs font-medium">
            Precio mensual — en ARS (0 = gratis · -1 = contactar)
          </label>
          <input
            type="number"
            step="0.01"
            min={-1}
            {...field("priceMonthly")}
            className="flex h-8 w-full rounded border border-input bg-background px-2 py-1 text-sm"
          />
          {form.priceMonthly === "-1" && (
            <p className="text-[11px] text-amber-600 font-medium">
              → Se mostrará "A medida / Contactar" en el landing
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="h-8 px-3 rounded border text-sm hover:bg-muted">
          Cancelar
        </button>
        <button
          disabled={loading || !form.name}
          onClick={() => {
            const raw = parseFloat(form.priceMonthly);
            const priceInCents = raw === -1 ? -1 : toCents(raw || 0);
            onSave({ ...form, description: form.description || null, priceMonthly: priceInCents });
          }}
          className="h-8 px-3 rounded bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </div>
  );
}

function SortablePlanRow({
  plan,
  editingId,
  setEditingId,
  onToggle,
  onSave,
  togglePending,
  updatePending,
}: {
  plan: Plan;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  onToggle: (id: string) => void;
  onSave: (id: string, data: Partial<Plan>) => void;
  togglePending: boolean;
  updatePending: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: plan.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const isEditing = editingId === plan.id;

  return (
    <React.Fragment>
      <tr
        ref={setNodeRef}
        style={style}
        className={`hover:bg-muted/30 transition-colors ${plan.isHidden ? "opacity-50" : ""} ${isDragging ? "bg-muted/40" : ""}`}
      >
        {/* Drag handle */}
        <td className="px-2 py-3 w-8">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground hover:text-foreground"
            aria-label="Arrastrar para reordenar"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        </td>
        <td className="px-3 py-3 font-medium">{plan.name}</td>
        <td className="px-3 py-3 text-right text-sm tabular-nums">
          {plan.priceMonthly === -1 ? (
            <span className="text-amber-600 font-medium">Contactar</span>
          ) : plan.priceMonthly === 0 ? (
            <span className="text-muted-foreground">Gratis</span>
          ) : (
            <>{formatCurrency(plan.priceMonthly)}</>
          )}
        </td>
        <td className="px-3 py-3 text-center">{limitLabel(plan.maxProducts)}</td>
        <td className="px-3 py-3 text-center">{limitLabel(plan.maxCategories)}</td>
        <td className="px-3 py-3 text-center">{limitLabel(plan.maxStaffUsers)}</td>
        <td className="px-3 py-3 text-center">{limitLabel(plan.maxImages)}</td>
        <td className="px-3 py-3 text-center">
          <button
            disabled={togglePending}
            onClick={() => onToggle(plan.id)}
            className={`text-xs font-medium ${plan.isHidden ? "text-muted-foreground hover:text-foreground" : "text-green-700 hover:text-green-900"}`}
          >
            {plan.isHidden ? "Oculto" : "Visible"}
          </button>
        </td>
        <td className="px-4 py-3 text-right">
          <button
            onClick={() => setEditingId(isEditing ? null : plan.id)}
            className="text-xs text-primary hover:underline"
          >
            {isEditing ? "Cancelar" : "Editar"}
          </button>
        </td>
      </tr>
      {isEditing && (
        <tr key={`${plan.id}-edit`}>
          <td colSpan={9} className="px-4 bg-muted/20">
            <PlanForm
              initial={plan}
              onSave={(data) => onSave(plan.id, data)}
              onCancel={() => setEditingId(null)}
              loading={updatePending}
            />
          </td>
        </tr>
      )}
    </React.Fragment>
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const createMutation = useMutation({
    mutationFn: (data: Partial<Plan>) => apiBffPlatform.post("/plans", data),
    onSuccess: () => {
      toast.success("Plan creado");
      setCreatingNew(false);
      void qc.invalidateQueries({ queryKey: ["platform-plans"] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Error al crear plan";
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
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["platform-plans"] }),
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Error al cambiar visibilidad";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (ids: string[]) => apiBffPlatform.patch("/plans/reorder", { ids }),
    onError: () => {
      toast.error("Error al guardar el nuevo orden");
      void qc.invalidateQueries({ queryKey: ["platform-plans"] });
    },
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = plans.findIndex((p) => p.id === active.id);
    const newIndex = plans.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(plans, oldIndex, newIndex);

    // Optimistic update
    qc.setQueryData<Plan[]>(["platform-plans"], reordered);

    reorderMutation.mutate(reordered.map((p) => p.id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Planes</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Arrastrá las filas para cambiar el orden en el landing.</p>
        </div>
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
              <th className="w-8 px-2 py-3" />
              <th className="text-left px-3 py-3 font-medium">Nombre</th>
              <th className="text-right px-3 py-3 font-medium">Precio/mes</th>
              <th className="text-center px-3 py-3 font-medium">Productos</th>
              <th className="text-center px-3 py-3 font-medium">Categorías</th>
              <th className="text-center px-3 py-3 font-medium">Staff</th>
              <th className="text-center px-3 py-3 font-medium">Imágenes</th>
              <th className="text-center px-3 py-3 font-medium">Visible</th>
              <th className="text-right px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {creatingNew && (
              <tr>
                <td colSpan={9} className="px-4">
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
                  <td colSpan={9} className="px-4 py-3">
                    <div className="h-4 bg-muted animate-pulse rounded" />
                  </td>
                </tr>
              ))}

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={plans.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                {plans.map((plan) => (
                  <SortablePlanRow
                    key={plan.id}
                    plan={plan}
                    editingId={editingId}
                    setEditingId={setEditingId}
                    onToggle={(id) => toggleMutation.mutate(id)}
                    onSave={(id, data) => updateMutation.mutate({ id, data })}
                    togglePending={toggleMutation.isPending}
                    updatePending={updateMutation.isPending}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </tbody>
        </table>
      </div>
    </div>
  );
}
