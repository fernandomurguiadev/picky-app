/** Construye la URL de compartir con parámetros UTM para tracking de WhatsApp */
export function buildShareUrl(pathname: string, searchParams: URLSearchParams): string {
  const params = new URLSearchParams(searchParams.toString());
  params.set("utm_source", "whatsapp_share");
  params.set("utm_medium", "seller_link");
  return `${window.location.origin}${pathname}?${params.toString()}`;
}

/** Abre el share nativo (móvil) o wa.me como fallback (desktop) */
export function shareViaWhatsApp(url: string): void {
  const text = `Mirá este catálogo: ${url}`;
  if (typeof navigator !== "undefined" && navigator.share) {
    navigator.share({ text }).catch(() => {});
  } else {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  }
}
