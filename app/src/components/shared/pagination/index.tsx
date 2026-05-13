import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string>;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  basePath,
  searchParams = {},
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const buildUrl = (p: number) => {
    const params = new URLSearchParams({ ...searchParams, page: String(p) });
    return `${basePath}?${params.toString()}`;
  };

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav
      aria-label="Paginación"
      className={cn("flex items-center justify-center gap-1", className)}
    >
      <Link
        href={hasPrev ? buildUrl(page - 1) : "#"}
        aria-disabled={!hasPrev}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-md border text-sm transition-colors",
          hasPrev
            ? "hover:bg-muted border-border"
            : "pointer-events-none opacity-40 border-border"
        )}
        aria-label="Página anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <Link
          key={p}
          href={buildUrl(p)}
          aria-current={p === page ? "page" : undefined}
          className={cn(
            "flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-sm transition-colors",
            p === page
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border hover:bg-muted"
          )}
        >
          {p}
        </Link>
      ))}

      <Link
        href={hasNext ? buildUrl(page + 1) : "#"}
        aria-disabled={!hasNext}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-md border text-sm transition-colors",
          hasNext
            ? "hover:bg-muted border-border"
            : "pointer-events-none opacity-40 border-border"
        )}
        aria-label="Página siguiente"
      >
        <ChevronRight className="h-4 w-4" />
      </Link>
    </nav>
  );
}
