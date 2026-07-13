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
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiBffPlatform } from "@/lib/api/platform";
import { toast } from "sonner";
import { toCents, fromCents, formatCurrency } from "@/lib/utils/currency";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface Feature {
  id: string;
  code: string;
  name: string;
  description?: string | null;
}

interface PlanFeatureItem {
  feature: Feature;
}

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
  planFeatures?: PlanFeatureItem[];
}

function limitLabel(n: number) {
  return n === -1 ? "∞" : String(n);
}

// ── Plan Form (campos cuantitativos) ──────────────────────────────────────────

function PlanForm({
  form,
  onChange,
}: {
  form: {
    name: string;
    description: string;
    maxProducts: number;
    maxCategories: number;
    maxStaffUsers: number;
    maxImages: number;
    priceMonthly: string;
  };
  onChange: (updates: Partial<typeof form>) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-xs font-medium">Nombre</label>
        <input
          value={form.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="flex h-8 w-full rounded border border-input bg-background px-2 py-1 text-sm"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium">Descripción (se muestra en el landing)</label>
        <textarea
          rows={2}
          value={form.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Ej: Ideal para negocios que quieren empezar sin gastar nada."
          className="flex w-full rounded border border-input bg-background px-2 py-1 text-sm resize-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
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
              value={form[key]}
              onChange={(e) => onChange({ [key]: parseInt(e.target.value, 10) })}
              className="flex h-8 w-full rounded border border-input bg-background px-2 py-1 text-sm"
            />
          </div>
        ))}
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium">
          Precio mensual — en ARS (0 = gratis · -1 = contactar)
        </label>
        <input
          type="number"
          step="0.01"
          min={-1}
          value={form.priceMonthly}
          onChange={(e) => onChange({ priceMonthly: e.target.value })}
          className="flex h-8 w-full rounded border border-input bg-background px-2 py-1 text-sm"
        />
        {form.priceMonthly === "-1" && (
          <p className="text-[11px] text-amber-600 font-medium">
            → Se mostrará "A medida / Contactar" en el landing
          </p>
        )}
      </div>
    </div>
  );
}

// ── Features Selector ─────────────────────────────────────────────────────────

function FeaturesSelector({
  allFeatures,
  selectedIds,
  onChange,
}: {
  allFeatures: Feature[];
  selectedIds: Set<string>;
  onChange: (ids: Set<string>) => void;
}) {
  function toggle(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  }

  if (allFeatures.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-2">
        No hay features creadas aún. Creá features en la sección correspondiente.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {allFeatures.map((f) => (
        <label
          key={f.id}
          className="flex items-start gap-2.5 cursor-pointer group"
        >
          <Checkbox
            checked={selectedIds.has(f.id)}
            onCheckedChange={() => toggle(f.id)}
            className="mt-0.5"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-none">{f.name}</p>
            {f.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{f.description}</p>
            )}
          </div>
          <Badge variant="outline" className="text-[10px] font-mono shrink-0">
            {f.code}
          </Badge>
        </label>
      ))}
    </div>
  );
}

// ── Edit Plan Modal ───────────────────────────────────────────────────────────

function EditPlanModal({
  plan,
  allFeatures,
  open,
  onClose,
  onSavePlan,
  onSaveFeatures,
  savingPlan,
  savingFeatures,
}: {
  plan: Plan;
  allFeatures: Feature[];
  open: boolean;
  onClose: () => void;
  onSavePlan: (id: string, data: Partial<Plan>) => void;
  onSaveFeatures: (id: string, featureIds: string[]) => void;
  savingPlan: boolean;
  savingFeatures: boolean;
}) {
  const [form, setForm] = useState({
    name: plan.name,
    description: plan.description ?? "",
    maxProducts: plan.maxProducts,
    maxCategories: plan.maxCategories,
    maxStaffUsers: plan.maxStaffUsers,
    maxImages: plan.maxImages,
    priceMonthly:
      plan.priceMonthly === -1
        ? "-1"
        : plan.priceMonthly
        ? fromCents(plan.priceMonthly).toString()
        : "0",
  });

  const [selectedFeatureIds, setSelectedFeatureIds] = useState<Set<string>>(
    new Set((plan.planFeatures ?? []).map((pf) => pf.feature.id)),
  );

  const isSaving = savingPlan || savingFeatures;

  function handleSave() {
    const raw = parseFloat(form.priceMonthly);
    const priceInCents = raw === -1 ? -1 : toCents(raw || 0);
    onSavePlan(plan.id, { ...form, description: form.description || null, priceMonthly: priceInCents });
    onSaveFeatures(plan.id, [...selectedFeatureIds]);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar plan — {plan.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-1">
          {/* Campos del plan */}
          <PlanForm
            form={form}
            onChange={(updates) => setForm((f) => ({ ...f, ...updates }))}
          />

          {/* Separador */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-sm font-semibold">Features habilitadas</p>
              <Badge variant="secondary" className="text-xs">
                {selectedFeatureIds.size} / {allFeatures.length}
              </Badge>
            </div>
            <FeaturesSelector
              allFeatures={allFeatures}
              selectedIds={selectedFeatureIds}
              onChange={setSelectedFeatureIds}
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2 border-t">
          <button
            onClick={onClose}
            className="h-8 px-3 rounded border text-sm hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            disabled={isSaving || !form.name}
            onClick={handleSave}
            className="h-8 px-3 rounded bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50"
          >
            {isSaving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Create Plan Modal ─────────────────────────────────────────────────────────

function CreatePlanModal({
  open,
  onClose,
  onCreate,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: Partial<Plan>) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    maxProducts: 10,
    maxCategories: 3,
    maxStaffUsers: 1,
    maxImages: 10,
    priceMonthly: "0",
  });

  function handleSave() {
    const raw = parseFloat(form.priceMonthly);
    const priceInCents = raw === -1 ? -1 : toCents(raw || 0);
    onCreate({ ...form, description: form.description || null, priceMonthly: priceInCents });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo plan</DialogTitle>
        </DialogHeader>
        <div className="py-1">
          <PlanForm
            form={form}
            onChange={(updates) => setForm((f) => ({ ...f, ...updates }))}
          />
        </div>
        <div className="flex gap-2 justify-end pt-2 border-t">
          <button onClick={onClose} className="h-8 px-3 rounded border text-sm hover:bg-muted">
            Cancelar
          </button>
          <button
            disabled={saving || !form.name}
            onClick={handleSave}
            className="h-8 px-3 rounded bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Creando…" : "Crear plan"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Sortable Row ──────────────────────────────────────────────────────────────

function SortablePlanRow({
  plan,
  onEdit,
  onToggle,
  togglePending,
}: {
  plan: Plan;
  onEdit: (plan: Plan) => void;
  onToggle: (id: string) => void;
  togglePending: boolean;
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

  const featureCount = plan.planFeatures?.length ?? 0;

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`hover:bg-muted/30 transition-colors ${plan.isHidden ? "opacity-50" : ""} ${isDragging ? "bg-muted/40" : ""}`}
    >
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
        <div className="flex items-center justify-center gap-1.5">
          {featureCount > 0 ? (
            <Badge variant="secondary" className="text-xs tabular-nums">
              {featureCount}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
      </td>
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
          onClick={() => onEdit(plan)}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <Pencil className="h-3 w-3" />
          Editar
        </button>
      </td>
    </tr>
  );
}

// ── Feature Row ───────────────────────────────────────────────────────────────

function FeatureRow({
  feature,
  onEdit,
  onDelete,
  deleting,
}: {
  feature: Feature;
  onEdit: (f: Feature) => void;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  return (
    <tr className="hover:bg-muted/30 transition-colors">
      <td className="px-3 py-3">
        <Badge variant="outline" className="text-[11px] font-mono">
          {feature.code}
        </Badge>
      </td>
      <td className="px-3 py-3 font-medium text-sm">{feature.name}</td>
      <td className="px-3 py-3 text-sm text-muted-foreground">
        {feature.description ?? <span className="italic">—</span>}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => onEdit(feature)}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Pencil className="h-3 w-3" />
            Editar
          </button>
          <button
            disabled={deleting}
            onClick={() => onDelete(feature.id)}
            className="inline-flex items-center gap-1 text-xs text-destructive hover:underline disabled:opacity-40"
          >
            <Trash2 className="h-3 w-3" />
            Eliminar
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Feature Modal (crear / editar) ────────────────────────────────────────────

function FeatureModal({
  initial,
  open,
  onClose,
  onSave,
  saving,
}: {
  initial?: Feature;
  open: boolean;
  onClose: () => void;
  onSave: (data: { code: string; name: string; description: string }) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    code: initial?.code ?? "",
    name: initial?.name ?? "",
    description: initial?.description ?? "",
  });

  const isEdit = !!initial;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar feature" : "Nueva feature"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1">
            <label className="text-xs font-medium">Código (único, MAYÚSCULAS)</label>
            <input
              value={form.code}
              disabled={isEdit}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              placeholder="Ej: REMOVE_BRANDING"
              className="flex h-8 w-full rounded border border-input bg-background px-2 py-1 text-sm font-mono disabled:opacity-50"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Nombre legible</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ej: Remover marca Picky"
              className="flex h-8 w-full rounded border border-input bg-background px-2 py-1 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Descripción (opcional)</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Ej: Oculta el branding de Picky en la tienda pública"
              className="flex w-full rounded border border-input bg-background px-2 py-1 text-sm resize-none"
            />
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-2 border-t">
          <button onClick={onClose} className="h-8 px-3 rounded border text-sm hover:bg-muted">
            Cancelar
          </button>
          <button
            disabled={saving || !form.code || !form.name}
            onClick={() => onSave(form)}
            className="h-8 px-3 rounded bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Guardando…" : isEdit ? "Guardar" : "Crear"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PlansPage() {
  const qc = useQueryClient();
  const [creatingNew, setCreatingNew] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [featureModal, setFeatureModal] = useState<{ mode: "create" | "edit"; feature?: Feature } | null>(null);

  const { data: plansData, isLoading } = useQuery<any>({
    queryKey: ["platform-plans"],
    queryFn: () => apiBffPlatform.get("/plans").then((r) => r.data),
  });

  const { data: featuresData } = useQuery<any>({
    queryKey: ["platform-features"],
    queryFn: () => apiBffPlatform.get("/features").then((r) => r.data),
  });

  const plans: Plan[] = Array.isArray(plansData) ? plansData : (Array.isArray(plansData?.data) ? plansData.data : []);
  const allFeatures: Feature[] = Array.isArray(featuresData) ? featuresData : (Array.isArray(featuresData?.data) ? featuresData.data : []);

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
    },
    onError: () => toast.error("Error al actualizar plan"),
  });

  const assignFeaturesMutation = useMutation({
    mutationFn: ({ id, featureIds }: { id: string; featureIds: string[] }) =>
      apiBffPlatform.put(`/plans/${id}/features`, { featureIds }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["platform-plans"] });
      setEditingPlan(null);
    },
    onError: () => toast.error("Error al actualizar features del plan"),
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

  const createFeatureMutation = useMutation({
    mutationFn: (data: { code: string; name: string; description: string }) =>
      apiBffPlatform.post("/features", data),
    onSuccess: () => {
      toast.success("Feature creada");
      setFeatureModal(null);
      void qc.invalidateQueries({ queryKey: ["platform-features"] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Error al crear feature";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    },
  });

  const updateFeatureMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; description: string } }) =>
      apiBffPlatform.patch(`/features/${id}`, data),
    onSuccess: () => {
      toast.success("Feature actualizada");
      setFeatureModal(null);
      void qc.invalidateQueries({ queryKey: ["platform-features"] });
    },
    onError: () => toast.error("Error al actualizar feature"),
  });

  const deleteFeatureMutation = useMutation({
    mutationFn: (id: string) => apiBffPlatform.delete(`/features/${id}`),
    onSuccess: () => {
      toast.success("Feature eliminada");
      void qc.invalidateQueries({ queryKey: ["platform-features"] });
      void qc.invalidateQueries({ queryKey: ["platform-plans"] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Error al eliminar feature";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    },
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = plans.findIndex((p) => p.id === active.id);
    const newIndex = plans.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(plans, oldIndex, newIndex);
    qc.setQueryData<Plan[]>(["platform-plans"], reordered);
    reorderMutation.mutate(reordered.map((p) => p.id));
  }

  function handleSavePlan(id: string, data: Partial<Plan>) {
    updateMutation.mutate({ id, data });
  }

  function handleSaveFeatures(id: string, featureIds: string[]) {
    assignFeaturesMutation.mutate({ id, featureIds });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Planes</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Arrastrá las filas para cambiar el orden en el landing.
          </p>
        </div>
        <button
          onClick={() => setCreatingNew(true)}
          className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
        >
          + Nuevo plan
        </button>
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
              <th className="text-center px-3 py-3 font-medium">Features</th>
              <th className="text-center px-3 py-3 font-medium">Visible</th>
              <th className="text-right px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={10} className="px-4 py-3">
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
                    onEdit={setEditingPlan}
                    onToggle={(id) => toggleMutation.mutate(id)}
                    togglePending={toggleMutation.isPending}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </tbody>
        </table>
      </div>

      {/* Modal: crear plan */}
      <CreatePlanModal
        open={creatingNew}
        onClose={() => setCreatingNew(false)}
        onCreate={(data) => createMutation.mutate(data)}
        saving={createMutation.isPending}
      />

      {/* Modal: editar plan */}
      {editingPlan && (
        <EditPlanModal
          plan={editingPlan}
          allFeatures={allFeatures}
          open={!!editingPlan}
          onClose={() => setEditingPlan(null)}
          onSavePlan={handleSavePlan}
          onSaveFeatures={handleSaveFeatures}
          savingPlan={updateMutation.isPending}
          savingFeatures={assignFeaturesMutation.isPending}
        />
      )}

      {/* ── Sección: Catálogo de features ──────────────────────────── */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Catálogo de features</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Features habilitables por plan. El nombre se muestra en el landing.
            </p>
          </div>
          <button
            onClick={() => setFeatureModal({ mode: "create" })}
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
          >
            + Nueva feature
          </button>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-3 py-3 font-medium w-48">Código</th>
                <th className="text-left px-3 py-3 font-medium">Nombre</th>
                <th className="text-left px-3 py-3 font-medium">Descripción</th>
                <th className="text-right px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {allFeatures.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No hay features creadas aún.
                  </td>
                </tr>
              )}
              {allFeatures.map((f) => (
                <FeatureRow
                  key={f.id}
                  feature={f}
                  onEdit={(feat) => setFeatureModal({ mode: "edit", feature: feat })}
                  onDelete={(id) => deleteFeatureMutation.mutate(id)}
                  deleting={deleteFeatureMutation.isPending}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: crear / editar feature */}
      {featureModal && (
        <FeatureModal
          open
          initial={featureModal.feature}
          onClose={() => setFeatureModal(null)}
          onSave={(data) => {
            if (featureModal.mode === "edit" && featureModal.feature) {
              updateFeatureMutation.mutate({ id: featureModal.feature.id, data });
            } else {
              createFeatureMutation.mutate(data);
            }
          }}
          saving={createFeatureMutation.isPending || updateFeatureMutation.isPending}
        />
      )}
    </div>
  );
}
