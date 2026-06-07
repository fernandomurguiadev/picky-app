"use client";

import { useState } from "react";
import { ShoppingCart, Eye, Check, Plus, Minus } from "lucide-react";
import type { CardStyle } from "@/lib/types/store";

export const hexRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

export function getContrastColor(hexColor: string) {
  if (!hexRegex.test(hexColor)) return "#ffffff";
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.substring(0, 2), 16);
  const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.substring(2, 4), 16);
  const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#ffffff";
}

function getCardStyles(
  style: CardStyle,
  primary: string,
  accent: string,
  isDark: boolean
): { wrapper: React.CSSProperties; imageArea: React.CSSProperties; info: React.CSSProperties; infoText: string } {
  const borderColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.09)";
  const cardBg = isDark ? "rgba(255,255,255,0.05)" : "#ffffff";
  const textColor = isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.85)";
  const imageBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
  const textOnPrimary = getContrastColor(primary);

  switch (style) {
    case "minimal":
      return {
        wrapper: { borderRadius: 6, border: `1px solid ${borderColor}`, background: "transparent", overflow: "hidden" },
        imageArea: { background: imageBg },
        info: { background: "transparent", borderTop: `1px solid ${borderColor}`, padding: "8px 10px" },
        infoText: textColor,
      };
    case "bold":
      return {
        wrapper: { borderRadius: 16, border: "none", background: cardBg, boxShadow: isDark ? "0 10px 28px rgba(0,0,0,0.5)" : "0 10px 28px rgba(0,0,0,0.18)", overflow: "hidden" },
        imageArea: { background: imageBg },
        info: { background: primary, padding: "10px 12px" },
        infoText: textOnPrimary,
      };
    case "glass":
      return {
        wrapper: { borderRadius: 16, border: `1px solid ${isDark ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.6)"}`, background: isDark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.55)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", overflow: "hidden" },
        imageArea: { background: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.3)" },
        info: { background: "transparent", borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"}`, padding: "8px 10px" },
        infoText: textColor,
      };
    case "outlined":
      return {
        wrapper: { borderRadius: 10, border: `2px solid ${primary}`, background: "transparent", overflow: "hidden" },
        imageArea: { background: imageBg },
        info: { background: "transparent", borderTop: `2px solid ${primary}`, padding: "8px 10px" },
        infoText: textColor,
      };
    case "retro":
      // Flat colorblock: primary color fills the entire card, no radius, no shadow
      return {
        wrapper: { borderRadius: 0, border: "none", background: primary, overflow: "hidden" },
        imageArea: { background: `${textOnPrimary === "#ffffff" ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.15)"}` },
        info: { background: "transparent", borderTop: `1.5px solid ${textOnPrimary === "#ffffff" ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.15)"}`, padding: "8px 10px" },
        infoText: textOnPrimary,
      };
    default: // "default"
      return {
        wrapper: { borderRadius: 12, border: `1px solid ${borderColor}`, background: cardBg, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" },
        imageArea: { background: imageBg },
        info: { background: primary, padding: "8px 10px" },
        infoText: textOnPrimary,
      };
  }
}

interface StorePreviewProps {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  storeName: string;
  cardStyle?: CardStyle;
}

export function StorePreview({
  primaryColor,
  accentColor,
  backgroundColor,
  storeName,
  cardStyle = "default",
}: StorePreviewProps) {
  const [activeTab, setActiveTab] = useState<"catalog" | "product">("catalog");
  const textOnPrimary = getContrastColor(primaryColor);
  const textOnAccent = getContrastColor(accentColor);
  const textBase = getContrastColor(backgroundColor);
  const isDarkTheme = textBase === "#ffffff";

  const products = [
    { name: "Hamburguesa Picky", price: "$3.500", icon: "🍔" },
    { name: "Papas Rústicas", price: "$1.800", icon: "🍟" },
  ];

  return (
    <div className="rounded-2xl border border-border overflow-hidden shadow-md bg-card flex flex-col">
      {/* Tabs */}
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

      {/* Frame */}
      <div
        className="flex-1 transition-all duration-300 min-h-[380px] flex flex-col"
        style={{
          backgroundColor,
          color: textBase,
          "--store-primary": primaryColor,
          "--store-accent": accentColor,
        } as React.CSSProperties}
      >
        {/* Header */}
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
          <div className="p-4 space-y-4 flex-1">
            {/* Categorías */}
            <div className="flex gap-2 overflow-hidden pb-1 border-b" style={{ borderColor: isDarkTheme ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)" }}>
              {["Inicio", "Hamburguesas", "Bebidas"].map((cat, i) => (
                <div
                  key={cat}
                  className="shrink-0 text-[10px] font-bold px-3 py-1 rounded-full shadow-xs"
                  style={{
                    backgroundColor: i === 1 ? primaryColor : (isDarkTheme ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.04)"),
                    color: i === 1 ? textOnPrimary : textBase,
                  }}
                >
                  {cat}
                </div>
              ))}
            </div>

            {/* Grid de productos — aplica cardStyle real */}
            <div className="grid grid-cols-2 gap-3">
              {products.map((prod, i) => {
                const { wrapper, imageArea, info, infoText } = getCardStyles(cardStyle, primaryColor, accentColor, isDarkTheme);
                const imgHeight = cardStyle === "bold" ? 80 : cardStyle === "minimal" ? 58 : 70;
                return (
                  <div key={i} style={wrapper} className="flex flex-col transition-all">
                    {/* Imagen */}
                    <div
                      className="flex items-center justify-center text-2xl"
                      style={{ height: imgHeight, ...imageArea }}
                    >
                      {prod.icon}
                    </div>

                    {/* Info */}
                    <div style={info} className="flex-1 flex flex-col justify-between">
                      <p className="text-[10px] font-bold leading-tight truncate" style={{ color: infoText }}>
                        {prod.name}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-extrabold text-[9px]" style={{ color: infoText }}>
                          {prod.price}
                        </span>
                        <button
                          type="button"
                          className="flex h-5 w-5 items-center justify-center rounded-full shadow-xs"
                          style={{ backgroundColor: accentColor, color: textOnAccent }}
                        >
                          <ShoppingCart className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Detalle producto */
          <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="mx-auto h-1 w-8 rounded-full bg-current/20" />
              <div className="rounded-xl overflow-hidden aspect-[16/8] w-full bg-muted/40 flex items-center justify-center text-3xl shadow-inner">
                🍔
              </div>
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-4">
                  <span className="font-extrabold text-xs">Hamburguesa Doble Cheddar</span>
                  <span className="font-bold text-xs shrink-0" style={{ color: primaryColor }}>$4.500</span>
                </div>
                <p className="text-[9px] opacity-70 leading-normal">
                  Doble carne smash, doble cheddar, panceta crocante y aderezo especial en pan brioche.
                </p>
              </div>
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
                        borderColor: opt.checked ? primaryColor + "30" : "transparent",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full border flex items-center justify-center shrink-0"
                          style={{
                            borderColor: opt.checked ? primaryColor : "currentColor",
                            backgroundColor: opt.checked ? primaryColor : "transparent",
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
            <div className="flex items-center justify-between gap-3 pt-1.5 border-t" style={{ borderColor: isDarkTheme ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
              <div className="flex items-center gap-1 border rounded-lg p-0.5" style={{ borderColor: isDarkTheme ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.15)" }}>
                <button type="button" className="p-1 rounded opacity-50"><Minus className="w-2 h-2" /></button>
                <span className="text-[10px] font-extrabold px-1">1</span>
                <button type="button" className="p-1 rounded"><Plus className="w-2 h-2" /></button>
              </div>
              <button
                type="button"
                className="flex-1 text-[10px] py-2 rounded-lg font-bold tracking-wide shadow-sm text-center"
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
