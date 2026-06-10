"use client";

import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Share2 } from "lucide-react";
import { buildShareUrl, shareViaWhatsApp } from "@/lib/utils/share";

function ShareButtonInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleShare = () => {
    const url = buildShareUrl(pathname, searchParams);
    shareViaWhatsApp(url);
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="flex items-center gap-1.5 shrink-0 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
      aria-label="Compartir catálogo por WhatsApp"
    >
      <Share2 className="h-3.5 w-3.5" />
      Compartir
    </button>
  );
}

export function SearchShareButton() {
  return (
    <Suspense fallback={<div className="h-7 w-20 animate-pulse rounded-full bg-muted" />}>
      <ShareButtonInner />
    </Suspense>
  );
}
