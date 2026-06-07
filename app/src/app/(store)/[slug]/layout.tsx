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
    : { data: { isOpen: false, nextChange: null, source: "manual", todaySchedule: null } };

  const store: StorePublicData = storeJson.data;
  const { isOpen, todaySchedule } = statusJson.data;

  const bgColor = store.theme?.backgroundColor ?? "#ffffff";
  const primaryColor = store.theme?.primaryColor ?? "#f97316";
  const accentColor = store.theme?.accentColor ?? "#fb923c";
  const cardStyle = store.theme?.cardStyle ?? "default";

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

    /* ── Card style variants — :root para cubrir portales ── */

    ${cardStyle === "default" ? `
      .store-card { border-radius: 0.75rem; border: 1px solid var(--border); background: var(--card); box-shadow: 0 1px 3px rgba(0,0,0,0.07); transition: box-shadow 0.2s; overflow: hidden; }
      .store-card:hover { box-shadow: 0 4px 14px rgba(0,0,0,0.13); }
      .store-card-info { background: var(--color-primary); color: var(--color-primary-foreground); border-radius: 0 0 0.75rem 0.75rem; }
    ` : ""}

    ${cardStyle === "minimal" ? `
      :root { --radius: 0.25rem; --radius-sm: 0.125rem; --radius-md: 0.25rem; --radius-lg: 0.25rem; --radius-xl: 0.375rem; --radius-2xl: 0.375rem; --radius-3xl: 0.5rem; }
      .rounded-full { border-radius: 0.25rem !important; }
      * { box-shadow: none !important; }
      /* Tarjetas: sin contenedor — imagen y texto flotan sobre el fondo */
      .store-card { border: none !important; background: transparent !important; border-radius: 0 !important; overflow: hidden; transition: opacity 0.15s; }
      .store-card:hover { opacity: 0.82; }
      .store-card-info { background: transparent !important; color: var(--foreground) !important; border-top: none !important; padding-top: 6px !important; padding-left: 0 !important; padding-right: 0 !important; }
      /* Chips de categoría: solo texto, sin fondo, con subrayado en activa */
      [data-store] nav a { background: transparent !important; font-weight: 600; }
    ` : ""}

    ${cardStyle === "bold" ? `
      :root { --radius: 1.5rem; --radius-sm: 1rem; --radius-md: 1.25rem; --radius-lg: 1.5rem; --radius-xl: 1.75rem; --radius-2xl: 2rem; --radius-3xl: 2.5rem; }
      /* Cards: pill-shaped con sombra dramática y footer accent */
      .store-card { border-radius: 2rem; border: none; background: color-mix(in srgb, var(--color-primary) 9%, var(--card)); box-shadow: 0 16px 48px rgba(0,0,0,0.28), 0 4px 16px rgba(0,0,0,0.14); transition: box-shadow 0.25s, transform 0.25s; overflow: hidden; }
      .store-card:hover { box-shadow: 0 24px 64px rgba(0,0,0,0.36); transform: translateY(-6px); }
      /* Footer: usa el color de acento — diferente a default que usa primary */
      .store-card-info { background: var(--store-accent, var(--color-primary)); color: var(--store-accent-foreground, var(--color-primary-foreground)); border-radius: 0 0 2rem 2rem; }
      /* Floating banner y drawer también con pills grandes */
      [data-store] .rounded-2xl { border-radius: 2rem !important; }
    ` : ""}

    ${cardStyle === "glass" ? `
      :root { --radius: 0.875rem; --radius-sm: 0.625rem; --radius-md: 0.75rem; --radius-lg: 0.875rem; --radius-xl: 1.125rem; --radius-2xl: 1.375rem; --radius-3xl: 1.75rem; }
      /* Cards: borde degradé primario→acento + cristal translúcido */
      .store-card {
        border-radius: 1rem;
        border: 2px solid transparent;
        background: ${isDarkBg ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.65)"} padding-box,
                    linear-gradient(135deg, var(--color-primary), var(--store-accent, var(--color-primary))) border-box;
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
        box-shadow: 0 2px 16px rgba(0,0,0,0.12);
        transition: box-shadow 0.2s;
        overflow: hidden;
      }
      /* Barra degradé de 4px arriba de cada tarjeta */
      .store-card::before {
        content: '';
        display: block;
        height: 4px;
        flex-shrink: 0;
        background: linear-gradient(90deg, var(--color-primary), var(--store-accent, var(--color-primary)));
      }
      .store-card:hover { box-shadow: 0 6px 28px rgba(0,0,0,0.18); }
      .store-card-info { background: transparent; color: var(--foreground); border-top: 1px solid ${isDarkBg ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"}; }
      /* Chips de categoría con borde degradé también */
      [data-store] nav a { border: 1.5px solid transparent !important; background: transparent padding-box, linear-gradient(135deg, var(--color-primary), var(--store-accent, var(--color-primary))) border-box !important; }
    ` : ""}

    ${cardStyle === "soft" ? `
      /* Cards: fondo degradé suave con el color de marca — muy visible */
      .store-card {
        border-radius: 0.875rem;
        border: none;
        background: linear-gradient(150deg,
          color-mix(in srgb, var(--color-primary) 20%, var(--card)),
          color-mix(in srgb, var(--store-accent, var(--color-primary)) 14%, var(--card)));
        box-shadow: 0 8px 32px color-mix(in srgb, var(--color-primary) 36%, transparent), 0 2px 8px color-mix(in srgb, var(--color-primary) 18%, transparent);
        transition: box-shadow 0.2s, transform 0.2s;
        overflow: hidden;
      }
      .store-card:hover { box-shadow: 0 14px 48px color-mix(in srgb, var(--color-primary) 44%, transparent); transform: translateY(-3px); }
      /* Footer: tinte más intenso del color primario */
      .store-card-info { background: color-mix(in srgb, var(--color-primary) 22%, var(--card)); color: var(--foreground); border-top: 2px solid color-mix(in srgb, var(--color-primary) 30%, transparent); }
    ` : ""}

    ${cardStyle === "retro" ? `
      :root {
        --radius: 0rem;
        --radius-sm: 0rem;
        --radius-md: 0rem;
        --radius-lg: 0rem;
        --radius-xl: 0rem;
        --radius-2xl: 0rem;
        --radius-3xl: 0rem;
      }
      .rounded-full, .rounded-3xl, .rounded-2xl, .rounded-xl,
      .rounded-lg, .rounded-md, .rounded-sm, .rounded { border-radius: 0 !important; }
      * { box-shadow: none !important; }
      .store-card { border-radius: 0; border: none; background: var(--color-primary); transition: opacity 0.15s; overflow: hidden; }
      .store-card:hover { opacity: 0.92; }
      .store-card-info { background: transparent; color: var(--color-primary-foreground); border-top: 1.5px solid rgba(255,255,255,0.2); }
    ` : ""}
  `.trim();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: themeCss }} />
      <div
        data-store
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
        <StoreHeader store={store} isOpen={isOpen} todaySchedule={todaySchedule} />
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
