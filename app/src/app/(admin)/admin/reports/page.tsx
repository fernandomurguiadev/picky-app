"use client";

import { useMemo, useState } from "react";
import { Lock, DollarSign, TrendingUp, PackageSearch, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { MetricCard } from "@/components/admin/metric-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchBar } from "@/components/shared/search-bar";
import { Pagination } from "@/components/shared/pagination";
import { useProfitability } from "@/lib/hooks/admin/use-reports";
import { useCategories } from "@/lib/hooks/admin/use-categories";
import { useProducts } from "@/lib/hooks/admin/use-products";
import { cn, formatCurrency } from "@/lib/utils";

type Mode = "catalog" | "sales";
const CATALOG_PAGE_SIZE = 20;

function monthRange(offset: number) {
  const base = subMonths(new Date(), offset);
  return {
    from: format(startOfMonth(base), "yyyy-MM-dd"),
    to: format(endOfMonth(base), "yyyy-MM-dd"),
    label: format(base, "MMMM yyyy", { locale: es }),
  };
}

export default function ReportsPage() {
  const [mode, setMode] = useState<Mode>("catalog");
  const [monthOffset, setMonthOffset] = useState(0);
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [catalogPage, setCatalogPage] = useState(1);

  const range = useMemo(() => monthRange(monthOffset), [monthOffset]);
  const { data: categories } = useCategories();

  const {
    data: salesData,
    isLoading: salesLoading,
    error: salesError,
  } = useProfitability(
    { from: range.from, to: range.to, categoryId, search: search || undefined },
    mode === "sales"
  );

  const {
    data: catalogData,
    isLoading: catalogLoading,
  } = useProducts({
    categoryId,
    search: search || undefined,
    isActive: true,
    page: catalogPage,
    limit: CATALOG_PAGE_SIZE,
  });

  const status = (salesError as { response?: { status?: number } } | null)?.response?.status;
  const isFeatureBlocked = mode === "sales" && status === 403;

  const handleFilterChange = () => setCatalogPage(1);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Rentabilidad</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {mode === "catalog"
            ? "Margen configurado de tu catálogo, se haya vendido o no."
            : "Margen y ganancia sobre tus pedidos confirmados."}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="inline-flex rounded-lg border border-border p-1 bg-accent/20">
          <button
            type="button"
            onClick={() => setMode("catalog")}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
              mode === "catalog"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Márgenes de catálogo
          </button>
          <button
            type="button"
            onClick={() => setMode("sales")}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
              mode === "sales"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Ventas reales
          </button>
        </div>

        {mode === "sales" && !isFeatureBlocked && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setMonthOffset((o) => o + 1)}
              aria-label="Mes anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium capitalize min-w-32 text-center">
              {range.label}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setMonthOffset((o) => Math.max(0, o - 1))}
              disabled={monthOffset === 0}
              aria-label="Mes siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {!isFeatureBlocked && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <SearchBar
            defaultValue={search}
            onChange={(v) => {
              setSearch(v);
              handleFilterChange();
            }}
            placeholder="Buscar producto..."
            className="sm:max-w-xs"
          />
          <Select
            value={categoryId ?? "all"}
            onValueChange={(v) => {
              setCategoryId(v === "all" ? undefined : v);
              handleFilterChange();
            }}
          >
            <SelectTrigger className="w-full sm:w-56">
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
        </div>
      )}

      {mode === "catalog" ? (
        <CatalogMarginTable
          data={catalogData}
          isLoading={catalogLoading}
          page={catalogPage}
          onPageChange={setCatalogPage}
        />
      ) : isFeatureBlocked ? (
        <div className="max-w-xl mx-auto mt-12 text-center rounded-2xl border border-border bg-card p-10">
          <Lock className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-bold mb-2">Rentabilidad es una función premium</h2>
          <p className="text-sm text-muted-foreground">
            Tu plan actual no incluye el panel de rentabilidad. Contactá a soporte para conocer los
            planes que lo incluyen.
          </p>
        </div>
      ) : salesLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      ) : salesError ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          No pudimos cargar la rentabilidad de este período. Probá de nuevo más tarde.
        </div>
      ) : salesData ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <MetricCard
              label="Ingresos"
              value={formatCurrency(salesData.revenue)}
              icon={<DollarSign />}
              trend={
                salesData.comparison.revenueChangePercent !== null
                  ? {
                      value: Math.round(salesData.comparison.revenueChangePercent),
                      isPositive: salesData.comparison.revenueChangePercent >= 0,
                      label: "vs. mes anterior",
                    }
                  : undefined
              }
              subtext={salesData.comparison.revenueChangePercent === null ? "Sin datos del mes anterior" : undefined}
            />
            <MetricCard
              label="Costo"
              value={formatCurrency(salesData.cost)}
              icon={<PackageSearch />}
              trend={
                salesData.comparison.costChangePercent !== null
                  ? {
                      value: Math.round(salesData.comparison.costChangePercent),
                      isPositive: salesData.comparison.costChangePercent <= 0,
                      label: "vs. mes anterior",
                    }
                  : undefined
              }
              subtext={salesData.comparison.costChangePercent === null ? "Sin datos del mes anterior" : undefined}
            />
            <MetricCard
              label="Margen bruto"
              value={`${formatCurrency(salesData.grossMargin)} (${salesData.marginPercent.toFixed(1)}%)`}
              icon={<TrendingUp />}
              trend={
                salesData.comparison.grossMarginChangePercent !== null
                  ? {
                      value: Math.round(salesData.comparison.grossMarginChangePercent),
                      isPositive: salesData.comparison.grossMarginChangePercent >= 0,
                      label: "vs. mes anterior",
                    }
                  : undefined
              }
              subtext={salesData.comparison.grossMarginChangePercent === null ? "Sin datos del mes anterior" : undefined}
            />
          </div>

          <div className="rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-semibold">Productos por ganancia</h3>
            </div>
            {salesData.byProduct.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground text-center">
                {categoryId || search
                  ? "Ningún producto coincide con el filtro aplicado en este período."
                  : "Todavía no hay pedidos confirmados con costo cargado en este período."}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-accent/30 text-muted-foreground">
                    <tr>
                      <th className="text-left font-medium px-5 py-3">Producto</th>
                      <th className="text-right font-medium px-5 py-3">Unidades</th>
                      <th className="text-right font-medium px-5 py-3">Ingresos</th>
                      <th className="text-right font-medium px-5 py-3">Costo</th>
                      <th className="text-right font-medium px-5 py-3">Margen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...salesData.byProduct]
                      .sort((a, b) => b.grossMargin - a.grossMargin)
                      .map((p) => (
                        <tr key={p.productId} className="border-t border-border">
                          <td className="px-5 py-3">
                            {p.productName}
                            {p.unitsMissingCost > 0 && (
                              <span className="block text-xs text-muted-foreground">
                                {p.unitsMissingCost} unidad(es) sin costo cargado
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right">{p.unitsSold}</td>
                          <td className="px-5 py-3 text-right">{formatCurrency(p.revenue)}</td>
                          <td className="px-5 py-3 text-right">{formatCurrency(p.cost)}</td>
                          <td className="px-5 py-3 text-right font-medium">
                            {formatCurrency(p.grossMargin)} ({p.marginPercent.toFixed(1)}%)
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

// ── Modo "Márgenes de catálogo" ─────────────────────────────────────────────

interface CatalogProduct {
  id: string;
  name: string;
  price: number;
  costPrice: number | null;
}

function CatalogMarginTable({
  data,
  isLoading,
  page,
  onPageChange,
}: {
  data: { data: CatalogProduct[]; meta: { totalPages: number } } | undefined;
  isLoading: boolean;
  page: number;
  onPageChange: (page: number) => void;
}) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border overflow-hidden">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const products = data?.data ?? [];

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="font-semibold">Margen por producto</h3>
      </div>
      {products.length === 0 ? (
        <p className="p-6 text-sm text-muted-foreground text-center">
          Ningún producto coincide con el filtro aplicado.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-accent/30 text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-5 py-3">Producto</th>
                  <th className="text-right font-medium px-5 py-3">Precio de compra</th>
                  <th className="text-right font-medium px-5 py-3">Precio de venta</th>
                  <th className="text-right font-medium px-5 py-3">Margen</th>
                </tr>
              </thead>
              <tbody>
                {[...products]
                  .sort((a, b) => {
                    const marginA = a.costPrice !== null ? a.price - a.costPrice : -Infinity;
                    const marginB = b.costPrice !== null ? b.price - b.costPrice : -Infinity;
                    return marginB - marginA;
                  })
                  .map((p) => {
                    const hasCost = p.costPrice !== null;
                    const margin = hasCost ? p.price - p.costPrice! : null;
                    const marginPercent =
                      hasCost && p.price > 0 ? ((margin as number) / p.price) * 100 : null;
                    return (
                      <tr key={p.id} className="border-t border-border">
                        <td className="px-5 py-3">{p.name}</td>
                        <td className="px-5 py-3 text-right">
                          {hasCost ? formatCurrency(p.costPrice as number) : (
                            <span className="text-muted-foreground text-xs">Sin costo cargado</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right">{formatCurrency(p.price)}</td>
                        <td className="px-5 py-3 text-right font-medium">
                          {margin !== null
                            ? `${formatCurrency(margin)} (${marginPercent!.toFixed(1)}%)`
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-4 border-t border-border">
            <Pagination
              page={page}
              totalPages={data?.meta.totalPages ?? 1}
              basePath="/admin/reports"
              onPageChange={onPageChange}
              scroll={false}
            />
          </div>
        </>
      )}
    </div>
  );
}
