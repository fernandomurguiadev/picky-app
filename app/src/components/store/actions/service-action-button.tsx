"use client";

import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ServiceActionButtonProps {
  serviceName: string;
  whatsappNumber: string | null;
  ctaText: string | null;
  className?: string;
  size?: "sm" | "default";
}

export function ServiceActionButton({
  serviceName,
  whatsappNumber,
  ctaText,
  className,
  size = "default",
}: ServiceActionButtonProps) {
  const label = ctaText || "Consultar";

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!whatsappNumber) return;
    const phone = whatsappNumber.replace(/\D/g, "");
    const text = encodeURIComponent(`Hola, estoy interesado en ${serviceName}`);
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank", "noopener,noreferrer");
  };

  if (size === "sm") {
    return (
      <button
        type="button"
        disabled={!whatsappNumber}
        onClick={handleClick}
        aria-label={`${label}: ${serviceName}`}
        className={cn(
          "flex items-center justify-center rounded-full bg-[var(--store-accent)] text-[var(--store-accent-foreground)] transition-opacity hover:opacity-90 shadow-sm disabled:opacity-30 disabled:cursor-not-allowed",
          className
        )}
      >
        <MessageCircle className="h-4 w-4" />
      </button>
    );
  }

  return (
    <Button
      type="button"
      disabled={!whatsappNumber}
      className={cn(
        "w-full bg-[var(--store-accent)] text-[var(--store-accent-foreground)] hover:opacity-90",
        className
      )}
      onClick={handleClick}
      aria-label={`${label}: ${serviceName}`}
    >
      <MessageCircle className="h-4 w-4 mr-2" />
      {label}
    </Button>
  );
}
