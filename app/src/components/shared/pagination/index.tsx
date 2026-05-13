import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string>;
  className?: string;
  /** Si se provee, los botones llaman onPageChange en lugar de navegar por URL */
  onPageChange?: (page: number) => void;
}

export function Pagination({
  page,
  totalPages,
  basePath,
  searchParams = {},
  className,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const buildUrl = (p: number) => {
    const params = new URLSearchParams({ ...searchParams, page: String(p) });
    return `${basePath}?${params.toString()}`;
  };

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const btnClass = (active: boolean, enabled: boolean) =>
    cn(
      "flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-sm transition-colors",
      active
        ? "border-primary bg-primary text-primary-foreground"
        : enabled
        ? "border-border hover:bg-muted"
        : "pointer-events-none opacity-40 border-border"
    );

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  if (onPageChange) {
    return (
      <nav aria-label="Paginación" className={cn("flex items-center justify-center gap-1", className)}>
        <button type="button" onClick={() => onPageChange(page - 1)} disabled={!hasPrev} className={btnClass(false, hasPrev)} aria-label="Página anterior">
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p) => (
          <button key={p} type="button" onClick={() => onPageChange(p)} className={btnClass(p === page, true)} aria-current={p === page ? "page" : undefined}>
            {p}
          </button>
        ))}
        <button type="button" onClick={() => onPageChange(page + 1)} disabled={!hasNext} className={btnClass(false, hasNext)} aria-label="Página siguiente">
          <ChevronRight className="h-4 w-4" />
        </button>
      </nav>
    );
  }

  return (
    <nav
      aria-label="Paginación"
      className={cn("flex items-center justify-center gap-1", className)}
    >
      <Link
        href={hasPrev ? buildUrl(page - 1) : "#"}
        aria-disabled={!hasPrev}
        className={btnClass(false, hasPrev)}
        aria-label="Página anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </Link>

      {pages.map((p) => (
        <Link
          key={p}
          href={buildUrl(p)}
          aria-current={p === page ? "page" : undefined}
          className={btnClass(p === page, true)}
        >
          {p}
        </Link>
      ))}

      <Link
        href={hasNext ? buildUrl(page + 1) : "#"}
        aria-disabled={!hasNext}
        className={btnClass(false, hasNext)}
        aria-label="Página siguiente"
      >
        <ChevronRight className="h-4 w-4" />
      </Link>
    </nav>
  );
}
