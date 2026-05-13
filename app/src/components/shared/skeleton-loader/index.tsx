import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface SkeletonLoaderProps {
  rows?: number;
  columns?: number;
  className?: string;
  rowClassName?: string;
}

export function SkeletonLoader({
  rows = 3,
  columns = 1,
  className,
  rowClassName,
}: SkeletonLoaderProps) {
  return (
    <div
      className={cn("flex flex-col gap-3", className)}
      role="status"
      aria-label="Cargando..."
    >
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className={cn("flex gap-3", rowClassName)}>
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} className="h-10 flex-1 rounded-md" />
          ))}
        </div>
      ))}
    </div>
  );
}
