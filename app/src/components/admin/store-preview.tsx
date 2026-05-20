"use client";

import { useState } from "react";
import { ShoppingCart, Eye, Check, Plus, Minus } from "lucide-react";

export const hexRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

// Helper de contrates dinámicos YIQ
export function getContrastColor(hexColor: string) {
  if (!hexRegex.test(hexColor)) return "#ffffff";
  
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.substring(0, 2), 16);
  const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.substring(2, 4), 16);
  const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.substring(4, 6), 16);
  
  // Fórmula de luminiscencia estándar YIQ
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#ffffff";
}

interface StorePreviewProps {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  storeName: string;
}

export function StorePreview({
  primaryColor,
  accentColor,
  backgroundColor,
  storeName,
}: StorePreviewProps) {
  const [activeTab, setActiveTab] = useState<"catalog" | "product">("catalog");
  const textOnPrimary = getContrastColor(primaryColor);
  const textOnAccent = getContrastColor(accentColor);
  const textBase = getContrastColor(backgroundColor);
  const isDarkTheme = textBase === "#ffffff";

  return (
    <div className="rounded-2xl border border-border overflow-hidden shadow-md bg-card flex flex-col">
      {/* Selector de frames interactivo */}
      <div className="flex border-b border-border bg-muted/40 p-1 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab("catalog")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "catalog"
              ? "bg-background text-foreground shadow-xs border border-border/30"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          📱 Catálogo (Cards)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("product")}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "product"
              ? "bg-background text-foreground shadow-xs border border-border/30"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          🛍️ Detalle / Carrito
        </button>
      </div>

      {/* Frame de la Vista Pública */}
      <div
        className="flex-1 transition-all duration-300 min-h-[380px] flex flex-col"
        style={{ 
          backgroundColor, 
          color: textBase,
          "--store-primary": primaryColor, 
          "--store-accent": accentColor 
        } as React.CSSProperties}
      >
        {/* Header de la Tienda (Común a ambos frames para dar contexto) */}
        <div
          className="px-4 py-3.5 flex items-center justify-between transition-colors duration-200 shadow-sm shrink-0"
          style={{ backgroundColor: primaryColor, color: textOnPrimary }}
        >
          <span className="font-extrabold text-xs tracking-tight uppercase">{storeName || "Tu tienda"}</span>
          <div className="flex gap-2 items-center">
            <div className="h-3 w-12 rounded bg-current/25" />
            <ShoppingCart className="w-3.5 h-3.5" />
          </div>
        </div>

        {activeTab === "catalog" ? (
          /* 📱 FRAME A: CATÁLOGO DE PRODUCTOS */
          <div className="p-4 space-y-4 flex-1">
            {/* Barra de Categorías */}
            <div className="flex gap-2 overflow-hidden pb-1 border-b" style={{ borderColor: isDarkTheme ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)" }}>
              {["Inicio", "Hamburguesas", "Bebidas"].map((cat, i) => (
                <div
                  key={cat}
                  className="shrink-0 text-[10px] font-bold px-3 py-1 rounded-full transition-colors duration-200 shadow-xs"
                  style={{ 
                    backgroundColor: i === 1 ? primaryColor : (isDarkTheme ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.04)"), 
                    color: i === 1 ? textOnPrimary : textBase 
                  }}
                >
                  {cat}
                </div>
              ))}
            </div>

            {/* Grid de Productos con tarjetas idénticas a la vista pública */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: "Hamburguesa Picky", price: "$3.500", icon: "🍔" },
                { name: "Papas Rústicas", price: "$1.800", icon: "🍟" }
              ].map((prod, i) => (
                <div 
                  key={i} 
                  className="rounded-xl flex flex-col justify-between transition-all border overflow-hidden bg-card"
                  style={{ 
                    borderColor: isDarkTheme ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
                  }}
                >
                  {/* Imagen mockup */}
                  <div className="p-2.5 pb-0">
                    <div className="h-16 rounded-lg flex items-center justify-center text-2xl bg-muted/40 shadow-inner">
                      {prod.icon}
                    </div>
                  </div>
                  
                  {/* Info block con color primario dinámico */}
                  <div 
                    className="p-2.5 mt-2 flex-1 flex flex-col justify-between"
                    style={{ backgroundColor: primaryColor, color: textOnPrimary }}
                  >
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold leading-tight block truncate" style={{ color: textOnPrimary }}>{prod.name}</p>
                      <p className="text-[7px] leading-none opacity-80" style={{ color: textOnPrimary }}>Deliciosa opción.</p>
                    </div>
                    
                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="font-extrabold text-[9px]" style={{ color: textOnPrimary }}>{prod.price}</span>
                      <button
                        type="button"
                        className="flex h-5 w-5 items-center justify-center rounded-full shadow-xs transition-all hover:scale-105 active:scale-95"
                        style={{ backgroundColor: accentColor, color: textOnAccent }}
                        aria-label="Agregar al carrito"
                      >
                        <ShoppingCart className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* 🛍️ FRAME B: DETALLE DE PRODUCTO Y AGREGADO A CARRITO (SLIDE DRAWER MOCKUP) */
          <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              {/* Indicador de barra superior del Drawer */}
              <div className="mx-auto h-1 w-8 rounded-full bg-current/20" />
              
              <div className="rounded-xl overflow-hidden aspect-[16/8] w-full bg-muted/40 flex items-center justify-center text-3xl shadow-inner">
                🍔
              </div>

              <div className="space-y-1">
                <div className="flex items-start justify-between gap-4">
                  <span className="font-extrabold text-xs">Hamburguesa Doble Cheddar</span>
                  <span className="font-bold text-xs shrink-0" style={{ color: primaryColor }}>
                    $4.500
                  </span>
                </div>
                <p className="text-[9px] opacity-70 leading-normal">
                  Doble carne smash, doble cheddar, panceta crocante y aderezo especial en pan brioche.
                </p>
              </div>

              {/* Opciones obligatorias */}
              <div className="space-y-2 py-2 border-y" style={{ borderColor: isDarkTheme ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
                <div className="flex justify-between items-center text-[9px]">
                  <span className="font-bold">Elegí tu guarnición</span>
                  <span className="px-1.5 py-0.5 rounded-md text-[7px] font-extrabold bg-red-500/10 text-red-500 uppercase">Obligatorio</span>
                </div>
                
                <div className="space-y-1.5">
                  {[
                    { name: "Papas Fritas", price: "Gratis", checked: true },
                    { name: "Aros de Cebolla", price: "+$500", checked: false },
                  ].map((opt, idx) => (
                    <div 
                      key={idx} 
                      className="flex justify-between items-center text-[9px] px-2 py-1.5 rounded-lg border transition-all"
                      style={{ 
                        backgroundColor: isDarkTheme ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)",
                        borderColor: opt.checked ? primaryColor + "30" : "transparent"
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full border flex items-center justify-center shrink-0 transition-all shadow-xs"
                          style={{ 
                            borderColor: opt.checked ? primaryColor : "currentColor",
                            backgroundColor: opt.checked ? primaryColor : "transparent"
                          }}
                        >
                          {opt.checked && <Check className="w-2 h-2" style={{ color: textOnPrimary }} />}
                        </div>
                        <span className={opt.checked ? "font-bold" : "opacity-80"}>{opt.name}</span>
                      </div>
                      <span className="opacity-60 text-[8px]">{opt.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer del Drawer: Selector de Cantidad y Botón de Agregar (Primario) */}
            <div className="flex items-center justify-between gap-3 pt-1.5 border-t" style={{ borderColor: isDarkTheme ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
              {/* Selector de cantidad */}
              <div className="flex items-center gap-1 border rounded-lg p-0.5" style={{ borderColor: isDarkTheme ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.15)" }}>
                <button type="button" className="p-1 rounded hover:bg-current/10 shrink-0 opacity-50"><Minus className="w-2 h-2" /></button>
                <span className="text-[10px] font-extrabold px-1">1</span>
                <button type="button" className="p-1 rounded hover:bg-current/10 shrink-0"><Plus className="w-2 h-2" /></button>
              </div>

              {/* Botón Agregar al carrito usando color SECUNDARIO/ACCENT y su contraste */}
              <button
                type="button"
                className="flex-1 text-[10px] py-2 rounded-lg font-bold tracking-wide transition-all duration-200 hover:scale-[1.01] active:scale-95 shadow-sm text-center"
                style={{ backgroundColor: accentColor, color: textOnAccent }}
              >
                Agregar $4.500
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
