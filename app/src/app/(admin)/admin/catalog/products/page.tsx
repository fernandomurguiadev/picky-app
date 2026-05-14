"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchBar } from "@/components/shared/search-bar";
import { Pagination } from "@/components/shared/pagination";
import { SkeletonLoader } from "@/components/shared/skeleton-loader";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { useCategories } from "@/lib/hooks/admin/use-categories";
import {
  useProducts,
  useToggleProductStatus,
  useDeleteProduct,
  useReorderProducts,
  productKeys,
} from "@/lib/hooks/admin/use-products";
import { toast } from "@/components/shared/toast";
import { formatCurrency } from "@/lib/utils";
import type { Product, PaginatedResponse } from "@/lib/types/catalog";

const PAGE_SIZE = 20;

// ── Sortable Card ──────────────────────────────────────────────────────────────

function SortableProductCard({
  product,
  onDelete,
  toggleStatus,
}: {
  product: Product;
  onDelete: (p: Product) => void;
  toggleStatus: {
    mutate: (variables: { id: string; isActive: boolean }) => void;
  };
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-all"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground shrink-0"
        aria-label="Arrastrar para reordenar"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-12 w-12 rounded-lg object-cover shrink-0"
        />
      ) : (
        <div className="h-12 w-12 rounded-lg bg-muted shrink-0 flex items-center justify-center text-muted-foreground text-xs">
          Sin foto
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium truncate">{product.name}</p>
          {product.isFeatured && (
            <Badge variant="secondary" className="text-[10px] h-5">Destacado</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {product.category?.name ?? "Sin categoría"} · {formatCurrency(product.price)}
        </p>
      </div>

      <div className="flex items-center gap-4 shrink-0 ml-2">
        <div className="flex items-center gap-2 bg-muted/30 py-1.5 px-3 rounded-full border border-border/50">
          <span className="text-xs text-muted-foreground hidden sm:inline">Activo</span>
          <Switch
            checked={product.isActive}
            onCheckedChange={(val) =>
              toggleStatus.mutate({ id: product.id, isActive: val })
            }
            aria-label={`${product.isActive ? "Desactivar" : "Activar"} ${product.name}`}
          />
        </div>

        <div className="flex gap-1">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/admin/catalog/products/${product.id}/edit`} aria-label="Editar">
              <Pencil className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(product)}
            aria-label="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Products Page ──────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const { data: categories } = useCategories();

  const queryParams = {
    page,
    limit: PAGE_SIZE,
    categoryId,
    search: search || undefined,
    isActive: filterActive,
  };

  const { data, isLoading } = useProducts(queryParams);

  const toggleStatus = useToggleProductStatus();
  const deleteProduct = useDeleteProduct();
  const reorderMutation = useReorderProducts();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !data) return;

    const oldIndex = data.data.findIndex((p) => p.id === active.id);
    const newIndex = data.data.findIndex((p) => p.id === over.id);

    const reorderedItems = arrayMove(data.data, oldIndex, newIndex);

    // Optimistic update
    const currentQueryKey = productKeys.list(queryParams);
    queryClient.setQueryData<PaginatedResponse<Product>>(currentQueryKey, {
      ...data,
      data: reorderedItems,
    });

    try {
      await reorderMutation.mutateAsync(reorderedItems.map((p) => p.id));
      toast.success("Orden de productos guardado");
    } catch {
      toast.error("Error al persistir el nuevo orden");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleting) return;
    try {
      await deleteProduct.mutateAsync(deleting.id);
      toast.success("Producto eliminado");
    } catch {
      toast.error("Error al eliminar el producto");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {data?.meta.total ?? 0} productos · arrastrá para reordenar.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/catalog/products/new">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo producto
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <SearchBar
            key={search}
            defaultValue={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Buscar productos..."
          />
        </div>
        <Select
          value={categoryId ?? "all"}
          onValueChange={(v) => {
            setCategoryId(v === "all" ? undefined : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories?.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filterActive === undefined ? "all" : filterActive ? "active" : "inactive"}
          onValueChange={(v) => {
            setFilterActive(v === "all" ? undefined : v === "active" ? true : false);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="inactive">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading && <SkeletonLoader rows={6} columns={1} />}

      {!isLoading && data?.data.length === 0 && (
        <EmptyState
          title="Sin productos"
          description="Creá tu primer producto para empezar a vender."
          actionLabel="Crear producto"
          onAction={() => (window.location.href = "/admin/catalog/products/new")}
        />
      )}

      {!isLoading && data && data.data.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={data.data.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2.5">
              {data.data.map((product) => (
                <SortableProductCard
                  key={product.id}
                  product={product}
                  onDelete={setDeleting}
                  toggleStatus={toggleStatus}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Pagination */}
      {data && data.meta.totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            page={page}
            totalPages={data.meta.totalPages}
            basePath="/admin/catalog/products"
            onPageChange={setPage}
          />
        </div>
      )}

      <ConfirmModal
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Eliminar producto"
        description={`¿Eliminás "${deleting?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        isPending={deleteProduct.isPending}
      />
    </div>
  );
}
