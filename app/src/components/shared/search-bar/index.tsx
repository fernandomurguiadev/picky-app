"use client";

import { useRef, useCallback } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  defaultValue?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
  disabled?: boolean;
}

/**
 * SearchBar no controlado con debounce.
 * Para resetear externamente, cambiar el `key` del componente.
 */
export function SearchBar({
  defaultValue = "",
  onChange,
  placeholder = "Buscar...",
  debounceMs = 300,
  className,
  disabled = false,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      const val = e.target.value;
      timerRef.current = setTimeout(() => {
        onChange(val);
      }, debounceMs);
    },
    [debounceMs, onChange]
  );

  const handleClear = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    onChange("");
  };

  return (
    <div
      className={cn(
        "relative flex items-center gap-2 rounded-lg border border-border bg-background px-3 focus-within:ring-2 focus-within:ring-ring/50",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
      <input
        ref={inputRef}
        type="search"
        defaultValue={defaultValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 py-2 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
        aria-label={placeholder}
      />
      <button
        type="button"
        onClick={handleClear}
        className="flex h-4 w-4 items-center justify-center text-muted-foreground hover:text-foreground opacity-0 [input:not(:placeholder-shown)~&]:opacity-100 transition-opacity"
        aria-label="Limpiar búsqueda"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

