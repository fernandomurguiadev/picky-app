import { cn } from "@/lib/utils";

interface StoreStatusBadgeProps {
  isOpen: boolean;
  className?: string;
}

export function StoreStatusBadge({ isOpen, className }: StoreStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold shadow-xs",
        isOpen
          ? "bg-emerald-500/15 text-emerald-100 border border-emerald-500/30"
          : "bg-[var(--store-accent)] text-[var(--store-accent-foreground)]",
        className
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          isOpen ? "bg-emerald-400" : "bg-[var(--store-accent-foreground)]"
        )}
      />
      {isOpen ? "Abierto" : "Cerrado"}
    </span>
  );
}
