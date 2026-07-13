"use client";

import { useMemo, useState } from "react";
import { Lock, DollarSign, TrendingUp, PackageSearch, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { MetricCard } from "@/components/admin/metric-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useProfitability } from "@/lib/hooks/admin/use-reports";
import { formatCurrency } from "@/lib/utils";

function monthRange(offset: number) {
  const base = subMonths(new Date(), offset);
  return {
    from: format(startOfMonth(base), "yyyy-MM-dd"),
    to: format(endOfMonth(base), "yyyy-MM-dd"),
    label: format(base, "MMMM yyyy", { locale: es }),
  };
}

export default function ReportsPage() {
  const [monthOffset, setMonthOffset] = useState(0);
  const range = useMemo(() => monthRange(monthOffset), [monthOffset]);
  const { data, isLoading, error } = useProfitability({ from: range.from, to: range.to });

  const status = (error as { response?: { status?: number } } | null)?.response?.status;
  const isFeatureBlocked = status === 403;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rentabilidad</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Margen y ganancia sobre tus pedidos confirmados.
          </p>
        </div>
        {!isFeatureBlocked && (
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

      {isFeatureBlocked ? (
        <div className="max-w-xl mx-auto mt-12 text-center rounded-2xl border border-border bg-card p-10">
          <Lock className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-bold mb-2">Rentabilidad es una función premium</h2>
          <p className="text-sm text-muted-foreground">
            Tu plan actual no incluye el panel de rentabilidad. Contactá a soporte para conocer los
            planes que lo incluyen.
          </p>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          No pudimos cargar la rentabilidad de este período. Probá de nuevo más tarde.
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <MetricCard
              label="Ingresos"
              value={formatCurrency(data.revenue)}
              icon={<DollarSign />}
              trend={
                data.comparison.revenueChangePercent !== null
                  ? {
                      value: Math.round(data.comparison.revenueChangePercent),
                      isPositive: data.comparison.revenueChangePercent >= 0,
                      label: "vs. mes anterior",
                    }
                  : undefined
              }
              subtext={data.comparison.revenueChangePercent === null ? "Sin datos del mes anterior" : undefined}
            />
            <MetricCard
              label="Costo"
              value={formatCurrency(data.cost)}
              icon={<PackageSearch />}
              trend={
                data.comparison.costChangePercent !== null
                  ? {
                      value: Math.round(data.comparison.costChangePercent),
                      isPositive: data.comparison.costChangePercent <= 0,
                      label: "vs. mes anterior",
                    }
                  : undefined
              }
              subtext={data.comparison.costChangePercent === null ? "Sin datos del mes anterior" : undefined}
            />
            <MetricCard
              label="Margen bruto"
              value={`${formatCurrency(data.grossMargin)} (${data.marginPercent.toFixed(1)}%)`}
              icon={<TrendingUp />}
              trend={
                data.comparison.grossMarginChangePercent !== null
                  ? {
                      value: Math.round(data.comparison.grossMarginChangePercent),
                      isPositive: data.comparison.grossMarginChangePercent >= 0,
                      label: "vs. mes anterior",
                    }
                  : undefined
              }
              subtext={data.comparison.grossMarginChangePercent === null ? "Sin datos del mes anterior" : undefined}
            />
          </div>

          <div className="rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-semibold">Productos por ganancia</h3>
            </div>
            {data.byProduct.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground text-center">
                Todavía no hay pedidos confirmados con costo cargado en este período.
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
                    {[...data.byProduct]
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
