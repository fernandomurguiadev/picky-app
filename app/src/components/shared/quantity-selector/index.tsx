"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
}

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max,
  disabled = false,
  className,
}: QuantitySelectorProps) {
  const decrement = () => {
    if (value > min) onChange(value - 1);
  };

  const increment = () => {
    if (max === undefined || value < max) onChange(value + 1);
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border bg-background px-1 py-1",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
      role="group"
      aria-label="Cantidad"
    >
      <button
        type="button"
        onClick={decrement}
        disabled={disabled || value <= min}
        className="flex h-7 w-7 items-center justify-center rounded-full text-sm transition-colors hover:bg-muted disabled:opacity-40"
        aria-label="Reducir cantidad"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>

      <span
        className="min-w-[1.5rem] text-center text-sm font-semibold tabular-nums"
        aria-live="polite"
        aria-atomic="true"
      >
        {value}
      </span>

      <button
        type="button"
        onClick={increment}
        disabled={disabled || (max !== undefined && value >= max)}
        className="flex h-7 w-7 items-center justify-center rounded-full text-sm transition-colors hover:bg-muted disabled:opacity-40"
        aria-label="Aumentar cantidad"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
