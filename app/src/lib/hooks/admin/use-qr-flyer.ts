"use client";

import { useState } from "react";
import { toast } from "@/components/shared/toast";

export interface FlyerDownloadOptions {
  includeLogo: boolean;
  useColors: boolean;
}

export function useQrFlyerDownload() {
  const [isDownloading, setIsDownloading] = useState(false);

  const download = async (storeName: string, options: FlyerDownloadOptions) => {
    setIsDownloading(true);
    try {
      const params = new URLSearchParams({
        logo: String(options.includeLogo),
        colors: String(options.useColors),
      });

      const res = await fetch(
        `/api/backend/api/v1/stores/me/qr-flyer?${params}`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("Error al generar el flyer");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `flyer-${storeName.toLowerCase().replace(/\s+/g, "-")}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      toast.success("Flyer descargado");
    } catch {
      toast.error("No se pudo generar el flyer. Intentá de nuevo.");
    } finally {
      setIsDownloading(false);
    }
  };

  return { download, isDownloading };
}
