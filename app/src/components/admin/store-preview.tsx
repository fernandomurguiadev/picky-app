"use client";

import { ShoppingCart } from "lucide-react";
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
        wrapper: { borderRadius: 0, border: "none", background: "transparent", overflow: "hidden" },
        imageArea: { background: imageBg, borderRadius: 2, overflow: "hidden" },
        info: { background: "transparent", borderTop: "none", padding: "6px 0" },
        infoText: textColor,
      };
    case "bold": {
      const rB = parseInt(primary.replace("#","").substring(0,2),16);
      const gB = parseInt(primary.replace("#","").substring(2,4),16);
      const bB = parseInt(primary.replace("#","").substring(4,6),16);
      const tintBg = isDark ? `rgba(${rB},${gB},${bB},0.12)` : `rgb(${Math.round(255*0.91+rB*0.09)},${Math.round(255*0.91+gB*0.09)},${Math.round(255*0.91+bB*0.09)})`;
      const accentTextColor = getContrastColor(accent);
      return {
        wrapper: { borderRadius: 28, border: "none", background: tintBg, boxShadow: isDark ? "0 16px 40px rgba(0,0,0,0.6)" : "0 16px 40px rgba(0,0,0,0.26)", overflow: "hidden" },
        imageArea: { background: imageBg },
        info: { background: accent, padding: "10px 12px", borderRadius: "0 0 28px 28px" },
        infoText: accentTextColor,
      };
    }
    case "glass":
      return {
        wrapper: { borderRadius: 14, border: `1.5px solid transparent`, background: `${isDark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.6)"} padding-box, linear-gradient(135deg, ${primary}, ${accent}) border-box`, backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", boxShadow: "0 4px 18px rgba(0,0,0,0.14)", overflow: "hidden" },
        imageArea: { background: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.3)" },
        info: { background: "transparent", borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"}`, padding: "8px 10px" },
        infoText: textColor,
      };
    case "soft": {
      const r = parseInt(primary.replace("#","").substring(0,2),16);
      const g = parseInt(primary.replace("#","").substring(2,4),16);
      const b = parseInt(primary.replace("#","").substring(4,6),16);
      const ra = parseInt(accent.replace("#","").substring(0,2),16);
      const ga = parseInt(accent.replace("#","").substring(2,4),16);
      const ba = parseInt(accent.replace("#","").substring(4,6),16);
      const blend = (c: number, t: number) => isDark ? Math.round(c*t) : Math.round(255*(1-t)+c*t);
      const gradBg = `rgb(${blend(r,0.2)},${blend(g,0.2)},${blend(b,0.2)})`;
      const gradBg2 = `rgb(${blend(ra,0.14)},${blend(ga,0.14)},${blend(ba,0.14)})`;
      return {
        wrapper: { borderRadius: 12, border: "none", background: `linear-gradient(150deg, ${gradBg}, ${gradBg2})`, boxShadow: `0 8px 28px rgba(${r},${g},${b},0.36), 0 2px 8px rgba(${r},${g},${b},0.18)`, overflow: "hidden" },
        imageArea: { background: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.55)" },
        info: { background: `rgba(${r},${g},${b},0.2)`, borderTop: `2px solid rgba(${r},${g},${b},0.28)`, padding: "8px 10px" },
        infoText: textColor,
      };
    }
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
                  {cardStyle === "glass" && (
                    <div style={{ height: 3, flexShrink: 0, background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})` }} />
                  )}
                  <div
                    className="flex items-center justify-center text-2xl"
                    style={{ height: imgHeight, ...imageArea }}
                  >
                    {prod.icon}
                  </div>
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
      </div>
    </div>
  );
}
