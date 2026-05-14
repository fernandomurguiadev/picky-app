import React from "react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  className?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function MetricCard({ label, value, subtext, icon, className, trend }: MetricCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5",
        className
      )}
    >
      {/* Glow decoration on hover */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground tracking-tight group-hover:text-foreground transition-colors duration-300">
          {label}
        </span>
        <div className="rounded-xl bg-accent/50 p-2.5 text-muted-foreground transition-all duration-300 group-hover:bg-primary/10 group-hover:text-primary">
          {React.isValidElement(icon)
            ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "h-5 w-5" })
            : icon}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-3xl font-extrabold tracking-tight text-foreground transition-all duration-300 group-hover:scale-[1.02] origin-left">
          {value}
        </p>
        
        {trend && (
          <p
            className={cn(
              "mt-1 flex items-center text-xs font-semibold tracking-wide",
              trend.isPositive ? "text-emerald-600" : "text-destructive"
            )}
          >
            <span>{trend.isPositive ? "▲" : "▼"}</span>
            <span className="ml-1">{Math.abs(trend.value)}% vs ayer</span>
          </p>
        )}

        {subtext && !trend && (
          <p className="mt-1 text-xs font-medium text-muted-foreground/80">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}
