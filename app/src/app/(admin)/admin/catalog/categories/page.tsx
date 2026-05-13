"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SkeletonLoader } from "@/components/shared/skeleton-loader";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { CategoryFormDialog } from "@/components/admin/category-form-dialog";
import {
  useCategories,
  useDeleteCategory,
  useReorderCategories,
} from "@/lib/hooks/admin/use-categories";
import { toast } from "@/components/shared/toast";
import type { Category } from "@/lib/types/catalog";

// ── Sortable card ─────────────────────────────────────────────────────────────

function CategoryCard({
  category,
  onEdit,
  onDelete,
}: {
  category: Category;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        aria-label="Arrastrar para reordenar"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {category.imageUrl ? (
        <img
          src={category.imageUrl}
          alt={category.name}
          className="h-12 w-12 rounded-lg object-cover shrink-0"
        />
      ) : (
        <div className="h-12 w-12 rounded-lg bg-muted shrink-0 flex items-center justify-center text-muted-foreground text-xs">
          Sin imagen
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{category.name}</p>
        {category.productCount !== undefined && (
          <p className="text-xs text-muted-foreground">{category.productCount} productos</p>
        )}
      </div>

      <Badge variant={category.isActive ? "default" : "secondary"}>
        {category.isActive ? "Activa" : "Inactiva"}
      </Badge>

      <div className="flex gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(category)}
          aria-label="Editar categoría"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
          onClick={() => onDelete(category)}
          aria-label="Eliminar categoría"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const { data: categories, isLoading } = useCategories();
  const deleteMutation = useDeleteCategory();
  const reorderMutation = useReorderCategories();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !categories) return;

    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(categories, oldIndex, newIndex);
    reorderMutation.mutate(reordered.map((c) => c.id));
  };

  const handleEdit = (category: Category) => {
    setEditing(category);
    setDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleting) return;
    try {
      await deleteMutation.mutateAsync(deleting.id);
      toast.success("Categoría eliminada");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (msg?.includes("productos")) {
        toast.error("No se puede eliminar: la categoría tiene productos activos");
      } else {
        toast.error("Error al eliminar la categoría");
      }
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Categorías</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Arrastrá para reordenar cómo aparecen en tu tienda.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva categoría
        </Button>
      </div>

      {isLoading && <SkeletonLoader rows={4} columns={1} />}

      {!isLoading && categories?.length === 0 && (
        <EmptyState
          title="Sin categorías"
          description="Creá tu primera categoría para organizar tu catálogo."
          actionLabel="Crear categoría"
          onAction={() => setDialogOpen(true)}
        />
      )}

      {!isLoading && categories && categories.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={categories.map((c) => c.id)} strategy={rectSortingStrategy}>
            <div className="space-y-2">
              {categories.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  category={cat}
                  onEdit={handleEdit}
                  onDelete={setDeleting}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(null);
        }}
        category={editing}
      />

      <ConfirmModal
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Eliminar categoría"
        description={`¿Eliminás "${deleting?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
