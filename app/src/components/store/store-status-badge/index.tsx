import { cn } from "@/lib/utils";

interface StoreStatusBadgeProps {
  isOpen: boolean;
  className?: string;
}

export function StoreStatusBadge({ isOpen, className }: StoreStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        isOpen
          ? "bg-green-100 text-green-800"
          : "bg-gray-100 text-gray-600",
        className
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          isOpen ? "bg-green-500" : "bg-gray-400"
        )}
      />
      {isOpen ? "Abierto" : "Cerrado"}
    </span>
  );
}
