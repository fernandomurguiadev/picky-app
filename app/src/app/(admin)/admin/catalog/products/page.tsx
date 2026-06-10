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
import { useStoreSettings } from "@/lib/hooks/admin/use-store-settings";
import {
  useProducts,
  useToggleProductStatus,
  useToggleProductStock,
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
  toggleStock,
  canReorder,
}: {
  product: Product;
  onDelete: (p: Product) => void;
  toggleStatus: { mutate: (variables: { id: string; isActive: boolean }) => void };
  toggleStock: { mutate: (variables: { id: string; inStock: boolean }) => void };
  canReorder: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  const stockControl = product.stockQuantity !== null ? (
    <Badge
      variant={product.stockQuantity === 0 ? "destructive" : product.stockQuantity <= 5 ? "secondary" : "outline"}
      className="text-[10px] h-5 font-semibold"
    >
      {product.stockQuantity} uds
    </Badge>
  ) : (
    <Switch
      checked={product.inStock}
      onCheckedChange={(val) => toggleStock.mutate({ id: product.id, inStock: val })}
      aria-label={`${product.inStock ? "Marcar sin stock" : "Marcar con stock"}: ${product.name}`}
    />
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-all"
    >
      {/* Fila principal */}
      <div className="flex items-center gap-3 p-4">
        {canReorder ? (
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab touch-none text-muted-foreground hover:text-foreground shrink-0"
            aria-label="Arrastrar para reordenar"
          >
            <GripVertical className="h-5 w-5" />
          </button>
        ) : (
          <div className="w-5 shrink-0" />
        )}

        <img
          src={product.imageUrl || "/images/default-image.jpg"}
          alt={product.name}
          className="h-12 w-12 rounded-lg object-cover shrink-0"
        />

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

        {/* Controles — solo desktop */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-muted/30 py-1.5 px-3 rounded-full border border-border/50">
            <span className="text-xs text-muted-foreground">Stock</span>
            {stockControl}
          </div>
          <div className="flex items-center gap-2 bg-muted/30 py-1.5 px-3 rounded-full border border-border/50">
            <span className="text-xs text-muted-foreground">Activo</span>
            <Switch
              checked={product.isActive}
              onCheckedChange={(val) => toggleStatus.mutate({ id: product.id, isActive: val })}
              aria-label={`${product.isActive ? "Desactivar" : "Activar"} ${product.name}`}
            />
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-1 shrink-0">
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

      {/* Fila de controles — solo mobile */}
      <div className="sm:hidden flex items-center border-t border-border/40 pb-3 pt-2">
        <div className="flex-1 flex items-center justify-center gap-2">
          <span className="text-xs text-muted-foreground">Stock</span>
          {stockControl}
        </div>
        <div className="w-px h-5 bg-border/60 shrink-0" />
        <div className="flex-1 flex items-center justify-center gap-2">
          <span className="text-xs text-muted-foreground">Activo</span>
          <Switch
            checked={product.isActive}
            onCheckedChange={(val) => toggleStatus.mutate({ id: product.id, isActive: val })}
            aria-label={`${product.isActive ? "Desactivar" : "Activar"} ${product.name}`}
          />
        </div>
      </div>
    </div>
  );
}

// ── Products Page ──────────────────────────────────────────────────────────────

function readSession<T>(key: string, parse: (v: string) => T | undefined): T | undefined {
  try {
    const v = sessionStorage.getItem(key);
    return v ? parse(v) : undefined;
  } catch {
    return undefined;
  }
}

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const { data: storeSettings } = useStoreSettings();
  const isServices = storeSettings?.storeType === "services";
  const itemLabel = isServices ? "servicio" : "producto";
  const itemLabelPlural = isServices ? "servicios" : "productos";
  const [page, setPage] = useState<number>(() => {
    const n = readSession("picky-admin-products-page", (v) => {
      const parsed = Number(v);
      return isNaN(parsed) ? undefined : parsed;
    });
    return n ?? 1;
  });
  const [categoryId, setCategoryId] = useState<string | undefined>(() =>
    readSession("picky-admin-products-category", (v) => (v !== "all" ? v : undefined)),
  );
  const [search, setSearch] = useState<string>(() =>
    readSession("picky-admin-products-search", (v) => v) ?? "",
  );
  const [filterActive, setFilterActive] = useState<boolean | undefined>(() =>
    readSession("picky-admin-products-active", (v) =>
      v === "all" ? undefined : v === "true" ? true : false,
    ),
  );
  const [deleting, setDeleting] = useState<Product | null>(null);

  const handleCategoryChange = (val: string | undefined) => {
    setCategoryId(val);
    setPage(1);
    try {
      sessionStorage.setItem("picky-admin-products-category", val ?? "all");
      sessionStorage.setItem("picky-admin-products-page", "1");
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
    try {
      sessionStorage.setItem("picky-admin-products-search", val);
      sessionStorage.setItem("picky-admin-products-page", "1");
    } catch (e) {
      console.error(e);
    }
  };

  const handleActiveChange = (val: boolean | undefined) => {
    setFilterActive(val);
    setPage(1);
    try {
      sessionStorage.setItem("picky-admin-products-active", val === undefined ? "all" : String(val));
      sessionStorage.setItem("picky-admin-products-page", "1");
    } catch (e) {
      console.error(e);
    }
  };

  const handlePageChange = (val: number) => {
    setPage(val);
    try {
      sessionStorage.setItem("picky-admin-products-page", String(val));
    } catch (e) {
      console.error(e);
    }
  };

  const { data: categories } = useCategories();

  const queryParams = {
    page,
    limit: PAGE_SIZE,
    categoryId,
    search: search || undefined,
    isActive: filterActive,
  };

  const { data, isLoading, isFetching, isPlaceholderData } = useProducts(queryParams);
  const showSkeleton = isLoading || (isFetching && isPlaceholderData);

  const toggleStatus = useToggleProductStatus();
  const toggleStock = useToggleProductStock();
  const deleteProduct = useDeleteProduct();
  const reorderMutation = useReorderProducts();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const canReorder = !!categoryId && !search;

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!canReorder) return;
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
          <h1 className="text-2xl font-bold capitalize">{isServices ? "Servicios" : "Productos"}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {data?.meta.total ?? 0} {itemLabelPlural}
            {canReorder ? " · arrastrá para reordenar." : " · seleccioná una categoría para reordenar."}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/catalog/products/new">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Nuevo {itemLabel}</span>
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <SearchBar
            defaultValue={search}
            onChange={handleSearchChange}
            placeholder={`Buscar ${itemLabelPlural}...`}
          />
        </div>
        <Select
          value={categoryId ?? "all"}
          onValueChange={(v) => {
            handleCategoryChange(v === "all" ? undefined : v);
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
            handleActiveChange(v === "all" ? undefined : v === "active" ? true : false);
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
      {showSkeleton && <SkeletonLoader rows={6} columns={1} />}

      {!showSkeleton && data?.data.length === 0 && (
        <EmptyState
          title={`Sin ${itemLabelPlural}`}
          description={isServices ? `Creá tu primer servicio para que tus clientes puedan consultarte.` : `Creá tu primer producto para empezar a vender.`}
          actionLabel={`Crear ${itemLabel}`}
          onAction={() => (window.location.href = "/admin/catalog/products/new")}
        />
      )}

      {!showSkeleton && data && data.data.length > 0 && (
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
                  toggleStock={toggleStock}
                  canReorder={canReorder}
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
            onPageChange={handlePageChange}
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
