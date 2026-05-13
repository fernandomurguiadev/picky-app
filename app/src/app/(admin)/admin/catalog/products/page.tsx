"use client";

import { useState } from "react";import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
import { useProducts, useToggleProductStatus, useDeleteProduct } from "@/lib/hooks/admin/use-products";
import { toast } from "@/components/shared/toast";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/lib/types/catalog";

const PAGE_SIZE = 20;

export default function ProductsPage() {
  // Next.js 15: searchParams is a Promise (read synchronously is deprecated)
  // For client components, manage state locally
  const [page, setPage] = useState(1);
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const { data: categories } = useCategories();
  const { data, isLoading } = useProducts({
    page,
    limit: PAGE_SIZE,
    categoryId,
    search: search || undefined,
    isActive: filterActive,
  });

  const toggleStatus = useToggleProductStatus();
  const deleteProduct = useDeleteProduct();

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
            {data?.meta.total ?? 0} productos en total
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
            setFilterActive(
              v === "all" ? undefined : v === "active" ? true : false
            );
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

      {/* Table */}
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
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Producto</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Categoría</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Precio</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Activo</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.data.map((product) => (
                <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-10 w-10 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-muted shrink-0" />
                      )}
                      <div>
                        <p className="font-medium">{product.name}</p>
                        {product.isFeatured && (
                          <Badge variant="secondary" className="text-xs">Destacado</Badge>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {product.category?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Switch
                      checked={product.isActive}
                      onCheckedChange={(val) =>
                        toggleStatus.mutate({ id: product.id, isActive: val })
                      }
                      aria-label={`${product.isActive ? "Desactivar" : "Activar"} ${product.name}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/catalog/products/${product.id}/edit`} aria-label="Editar">
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleting(product)}
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
