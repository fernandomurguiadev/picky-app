"use client";

import { useState } from "react";
import { Warehouse, Plus, ChevronDown, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SkeletonLoader } from "@/components/shared/skeleton-loader";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchBar } from "@/components/shared/search-bar";
import { toast } from "@/components/shared/toast";
import {
  useStockProducts,
  useProductMovements,
  useCreateMovement,
  type StockMovementType,
  type CreateMovementDto,
} from "@/lib/hooks/admin/use-inventory";
import type { Product } from "@/lib/types/catalog";

// ── Movement type labels ────────────────────────────────────────────────────

const MOVEMENT_LABELS: Record<StockMovementType, string> = {
  purchase_in: "Ingreso de compra",
  sale_out: "Venta",
  adjustment: "Ajuste",
  waste: "Merma / descarte",
  cancellation_return: "Devolución por cancelación",
};

const MOVEMENT_VARIANTS: Record<
  StockMovementType,
  "default" | "secondary" | "destructive" | "outline"
> = {
  purchase_in: "default",
  cancellation_return: "secondary",
  adjustment: "secondary",
  sale_out: "outline",
  waste: "destructive",
};

// ── Movement history row ────────────────────────────────────────────────────

function MovementsPanel({ productId }: { productId: string }) {
  const { data, isLoading } = useProductMovements(productId);

  if (isLoading) {
    return <SkeletonLoader rows={3} columns={1} />;
  }

  if (!data || data.data.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-2">Sin movimientos registrados.</p>
    );
  }

  return (
    <div className="space-y-1.5 mt-2">
      {data.data.map((m) => (
        <div
          key={m.id}
          className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-muted/30 border border-border/40"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Badge
              variant={MOVEMENT_VARIANTS[m.type]}
              className="text-[10px] h-5 shrink-0"
            >
              {MOVEMENT_LABELS[m.type]}
            </Badge>
            {m.notes && (
              <span className="text-muted-foreground truncate">{m.notes}</span>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-2">
            <span
              className={
                m.type === "sale_out" || m.type === "waste"
                  ? "text-destructive font-semibold"
                  : "text-green-600 font-semibold"
              }
            >
              {m.type === "sale_out" || m.type === "waste" ? "-" : "+"}
              {m.quantity}
            </span>
            <span className="text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(m.createdAt).toLocaleDateString("es-AR", {
                day: "2-digit",
                month: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Product row ─────────────────────────────────────────────────────────────

function ProductStockRow({
  product,
  onAddMovement,
}: {
  product: Product;
  onAddMovement: (product: Product) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const qty = product.stockQuantity ?? 0;

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
          aria-label={expanded ? "Contraer" : "Ver historial"}
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        <img
          src={product.imageUrl || "/images/default-image.jpg"}
          alt={product.name}
          className="h-10 w-10 rounded-lg object-cover shrink-0"
        />

        <div className="flex-1 min-w-0">
          <p className="font-medium truncate text-sm">{product.name}</p>
          <p className="text-xs text-muted-foreground">{product.category?.name ?? "Sin categoría"}</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Badge
            variant={
              qty === 0 ? "destructive" : qty <= 5 ? "secondary" : "outline"
            }
            className="font-semibold min-w-[52px] justify-center"
          >
            {qty} uds
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAddMovement(product)}
            className="h-8 gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Movimiento
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-2">
          <MovementsPanel productId={product.id} />
        </div>
      )}
    </div>
  );
}

// ── Add movement dialog ─────────────────────────────────────────────────────

function AddMovementDialog({
  product,
  open,
  onOpenChange,
}: {
  product: Product | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [type, setType] = useState<CreateMovementDto["type"]>("purchase_in");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");

  const createMovement = useCreateMovement();

  const handleSubmit = async () => {
    if (!product) return;
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) {
      toast.error("Cantidad inválida");
      return;
    }
    try {
      await createMovement.mutateAsync({
        productId: product.id,
        dto: { type, quantity: qty, notes: notes || undefined },
      });
      toast.success("Movimiento registrado");
      onOpenChange(false);
      setQuantity("");
      setNotes("");
      setType("purchase_in");
    } catch {
      toast.error("Error al registrar el movimiento");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar movimiento</DialogTitle>
          {product && (
            <p className="text-sm text-muted-foreground">{product.name}</p>
          )}
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Tipo de movimiento</Label>
            <Select value={type} onValueChange={(v) => setType(v as CreateMovementDto["type"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="purchase_in">Ingreso de compra</SelectItem>
                <SelectItem value="adjustment">Ajuste de inventario</SelectItem>
                <SelectItem value="waste">Merma / descarte</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mv-qty">Cantidad</Label>
            <Input
              id="mv-qty"
              type="number"
              min={1}
              step={1}
              placeholder="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            {product && (
              <p className="text-xs text-muted-foreground">
                Stock actual: {product.stockQuantity ?? 0} uds
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mv-notes">Nota (opcional)</Label>
            <Input
              id="mv-notes"
              placeholder="Ej: Compra proveedor, conteo físico…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={200}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={createMovement.isPending}>
            {createMovement.isPending ? "Guardando..." : "Registrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const { data: products, isLoading } = useStockProducts();
  const [movementTarget, setMovementTarget] = useState<Product | null>(null);
  const [categoryId, setCategoryId] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Categorías únicas presentes en los productos con stock
  const categories = products
    ? Array.from(
        new Map(
          products
            .filter((p) => p.category)
            .map((p) => [p.category!.id, p.category!])
        ).values()
      ).sort((a, b) => a.name.localeCompare(b.name))
    : [];

  const filtered = products?.filter((p) => {
    const matchCat = categoryId === "all" || p.category?.id === categoryId;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  }) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Warehouse className="h-6 w-6 text-primary" />
            Inventario
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {products?.length ?? 0} productos con control de stock.
          </p>
        </div>
      </div>

      {/* Filtros */}
      {!isLoading && products && products.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1">
            <SearchBar
              defaultValue={search}
              onChange={setSearch}
              placeholder="Buscar producto..."
            />
          </div>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {isLoading && <SkeletonLoader rows={5} columns={1} />}

      {!isLoading && (!products || products.length === 0) && (
        <EmptyState
          title="Sin productos con control de stock"
          description="Activá el control de stock por cantidad en la edición de un producto para que aparezca aquí."
          actionLabel="Ir a productos"
          onAction={() => (window.location.href = "/admin/catalog/products")}
        />
      )}

      {!isLoading && products && products.length > 0 && filtered.length === 0 && (
        <EmptyState
          title="Sin resultados"
          description="No hay productos que coincidan con los filtros aplicados."
        />
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="space-y-2.5">
          {filtered.map((product) => (
            <ProductStockRow
              key={product.id}
              product={product}
              onAddMovement={setMovementTarget}
            />
          ))}
        </div>
      )}

      <AddMovementDialog
        product={movementTarget}
        open={!!movementTarget}
        onOpenChange={(v) => {
          if (!v) setMovementTarget(null);
        }}
      />
    </div>
  );
}
