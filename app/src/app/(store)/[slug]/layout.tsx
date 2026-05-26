import { notFound } from "next/navigation";
import { StoreHeader } from "@/components/store/store-header";
import { CartDrawer } from "@/components/store/cart-drawer";
import { FloatingCartBanner } from "@/components/store/floating-cart-banner";
import type { StorePublicData, StoreStatus } from "@/lib/types/store";

interface StoreLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

export default async function StoreLayout({ children, params }: StoreLayoutProps) {
  const { slug } = await params;

  const [storeRes, statusRes] = await Promise.all([
    fetch(`${BACKEND_URL}/api/v1/stores/${slug}`, {
      cache: "no-store",
    }),
    fetch(`${BACKEND_URL}/api/v1/stores/${slug}/status`, {
      cache: "no-store",
    }),
  ]);

  if (!storeRes.ok) notFound();

  const storeJson = await storeRes.json();
  const statusJson: { data: StoreStatus } = statusRes.ok
    ? await statusRes.json()
    : { data: { isOpen: false } };

  const store: StorePublicData = storeJson.data;
  const { isOpen } = statusJson.data;

  const bgColor = store.theme?.backgroundColor ?? "#ffffff";
  const primaryColor = store.theme?.primaryColor ?? "#f97316";
  const accentColor = store.theme?.accentColor ?? "#fb923c";

  // Determina si el color primario es claro u oscuro para calcular el color de texto óptimo
  const textOnPrimary = (() => {
    const hex = primaryColor.replace("#", "");
    if (hex.length !== 6 && hex.length !== 3) return "#ffffff";
    const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.substring(0, 2), 16);
    const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.substring(2, 4), 16);
    const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.substring(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? "#000000" : "#ffffff";
  })();

  // Determina si el color secundario es claro u oscuro para calcular el color de texto óptimo
  const textOnAccent = (() => {
    const hex = accentColor.replace("#", "");
    if (hex.length !== 6 && hex.length !== 3) return "#ffffff";
    const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.substring(0, 2), 16);
    const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.substring(2, 4), 16);
    const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.substring(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? "#000000" : "#ffffff";
  })();

  // Determina si el fondo es oscuro usando fórmula de luminiscencia YIQ
  const isDarkBg = (() => {
    const hex = bgColor.replace("#", "");
    if (hex.length !== 6 && hex.length !== 3) return false;
    const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.substring(0, 2), 16);
    const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.substring(2, 4), 16);
    const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.substring(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq < 128;
  })();

  const themeCss = `
    :root {
      --color-primary: ${primaryColor} !important;
      --store-primary: ${primaryColor} !important;
      --color-primary-foreground: ${textOnPrimary} !important;
      --store-primary-foreground: ${textOnPrimary} !important;
      --store-accent: ${accentColor} !important;
      --store-accent-foreground: ${textOnAccent} !important;
      --background: ${bgColor} !important;
      --color-background: ${bgColor} !important;
      --card: ${isDarkBg ? "rgba(255, 255, 255, 0.04)" : "#ffffff"} !important;
      --color-card: ${isDarkBg ? "rgba(255, 255, 255, 0.04)" : "#ffffff"} !important;
      --border: ${isDarkBg ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.07)"} !important;
      --color-border: ${isDarkBg ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.07)"} !important;
      --muted: ${isDarkBg ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.03)"} !important;
      --color-muted: ${isDarkBg ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.03)"} !important;
      
      /* Dynamic Text & Popover overlays for React Portals */
      --foreground: ${isDarkBg ? "rgba(255, 255, 255, 0.95)" : "oklch(0.145 0 0)"} !important;
      --color-foreground: ${isDarkBg ? "rgba(255, 255, 255, 0.95)" : "oklch(0.145 0 0)"} !important;
      --muted-foreground: ${isDarkBg ? "rgba(255, 255, 255, 0.6)" : "oklch(0.45 0 0)"} !important;
      --color-muted-foreground: ${isDarkBg ? "rgba(255, 255, 255, 0.6)" : "oklch(0.45 0 0)"} !important;
      --popover: ${bgColor} !important;
      --color-popover: ${bgColor} !important;
      --popover-foreground: ${isDarkBg ? "rgba(255, 255, 255, 0.95)" : "oklch(0.145 0 0)"} !important;
      --color-popover-foreground: ${isDarkBg ? "rgba(255, 255, 255, 0.95)" : "oklch(0.145 0 0)"} !important;
    }
    
    body {
      background-color: var(--color-background) !important;
      color: var(--foreground) !important;
    }
    
    /* 🛡️ Direct overrides for React Portal Dialogs, Drawers and sheets */
    [data-slot="dialog-content"],
    [class*="bg-background"],
    [class*="bg-popover"],
    .bg-background,
    .bg-popover {
      background-color: var(--color-background) !important;
      color: var(--foreground) !important;
    }
  `.trim();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: themeCss }} />
      <div 
        className={`min-h-screen flex flex-col transition-colors duration-300 ${isDarkBg ? "dark text-gray-100" : "text-foreground"}`}
        style={{
          backgroundColor: bgColor,
          "--background": bgColor,
          "--color-background": bgColor,
          "--foreground": isDarkBg ? "rgba(255, 255, 255, 0.95)" : "oklch(0.145 0 0)",
          "--color-foreground": isDarkBg ? "rgba(255, 255, 255, 0.95)" : "oklch(0.145 0 0)",
          "--muted-foreground": isDarkBg ? "rgba(255, 255, 255, 0.6)" : "oklch(0.45 0 0)",
          "--color-muted-foreground": isDarkBg ? "rgba(255, 255, 255, 0.6)" : "oklch(0.45 0 0)",
          "--popover": bgColor,
          "--color-popover": bgColor,
          "--popover-foreground": isDarkBg ? "rgba(255, 255, 255, 0.95)" : "oklch(0.145 0 0)",
          "--color-popover-foreground": isDarkBg ? "rgba(255, 255, 255, 0.95)" : "oklch(0.145 0 0)",
          "--color-primary": primaryColor,
          "--store-primary": primaryColor,
          "--color-primary-foreground": textOnPrimary,
          "--store-primary-foreground": textOnPrimary,
          "--store-accent": accentColor,
          "--store-accent-foreground": textOnAccent,
          "--card": isDarkBg ? "rgba(255, 255, 255, 0.04)" : "#ffffff",
          "--color-card": isDarkBg ? "rgba(255, 255, 255, 0.04)" : "#ffffff",
          "--border": isDarkBg ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.07)",
          "--color-border": isDarkBg ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.07)",
          "--muted": isDarkBg ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.03)",
          "--color-muted": isDarkBg ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.03)",
        } as React.CSSProperties}
      >
        <StoreHeader store={store} isOpen={isOpen} />
        <main className="flex-1">{children}</main>
        <footer className={`border-t py-6 text-center text-xs ${isDarkBg ? "border-white/10 text-muted-foreground/70" : "border-border text-muted-foreground"}`}>
          Powered by PickyApp
        </footer>

        {/* Floating Cart Banner for Mobile wrapped in the Drawer logic */}
        <CartDrawer>
          <FloatingCartBanner />
        </CartDrawer>
      </div>
    </>
  );
}
