"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import type { CardStyle } from "@/lib/types/store";

interface CardStyleOption {
  id: CardStyle;
  name: string;
  description: string;
}

const CARD_STYLES: CardStyleOption[] = [
  { id: "default",  name: "Default",   description: "Sombra suave, barra de color primario" },
  { id: "minimal",  name: "Minimal",   description: "Sin sombra, fondo transparente, muy limpio" },
  { id: "bold",     name: "Bold",      description: "Sombra pronunciada, sube al hover" },
  { id: "glass",    name: "Glass",     description: "Blur translúcido, ideal para fondos oscuros" },
  { id: "outlined", name: "Outlined",  description: "Solo borde de color primario, sin relleno" },
  { id: "retro",    name: "Retro",     description: "Colorblock plano, sin bordes, color primario total" },
];

interface MiniCardPreviewProps {
  style: CardStyle;
  primary: string;
  accent: string;
  bg: string;
}

function MiniCardPreview({ style, primary, accent, bg }: MiniCardPreviewProps) {
  const isDark = (() => {
    const hex = bg.replace("#", "");
    if (hex.length !== 6) return false;
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
  })();

  const textColor = isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.85)";
  const borderColor = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)";
  const cardBg = isDark ? "rgba(255,255,255,0.05)" : "#ffffff";
  const mutedBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";

  const wrapperStyle: React.CSSProperties = {
    backgroundColor: bg,
    padding: "6px",
    borderRadius: "6px",
    width: "100%",
    height: "100%",
  };

  const textOnPrimary = (() => {
    const hex = primary.replace("#", "");
    if (hex.length !== 6) return "#fff";
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 >= 128 ? "#000" : "#fff";
  })();

  const getCardStyle = (): React.CSSProperties => {
    switch (style) {
      case "default":
        return { borderRadius: 8, border: `1px solid ${borderColor}`, background: cardBg, boxShadow: "0 1px 4px rgba(0,0,0,0.1)", overflow: "hidden" };
      case "minimal":
        return { borderRadius: 4, border: `1px solid ${borderColor}`, background: "transparent", overflow: "hidden" };
      case "bold":
        return { borderRadius: 12, border: "none", background: cardBg, boxShadow: isDark ? "0 8px 20px rgba(0,0,0,0.5)" : "0 8px 20px rgba(0,0,0,0.18)", overflow: "hidden" };
      case "glass":
        return { borderRadius: 12, border: `1px solid ${isDark ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.6)"}`, background: isDark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.55)", backdropFilter: "blur(8px)", overflow: "hidden" };
      case "outlined":
        return { borderRadius: 8, border: `2px solid ${primary}`, background: "transparent", overflow: "hidden" };
      case "retro":
        return { borderRadius: 0, border: "none", background: primary, overflow: "hidden" };
    }
  };

  const getInfoStyle = (): React.CSSProperties => {
    switch (style) {
      case "default":
      case "bold":
        return { background: primary, padding: "4px 5px" };
      case "minimal":
        return { background: "transparent", padding: "4px 5px", borderTop: `1px solid ${borderColor}` };
      case "glass":
        return { background: "transparent", padding: "4px 5px", borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"}` };
      case "outlined":
        return { background: "transparent", padding: "4px 5px", borderTop: `2px solid ${primary}` };
      case "retro":
        return { background: "transparent", padding: "4px 5px", borderTop: `1.5px solid ${textOnPrimary === "#ffffff" ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.15)"}` };
    }
  };

  const imageBg: React.CSSProperties = style === "retro"
    ? { background: textOnPrimary === "#ffffff" ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.15)" }
    : { background: mutedBg };

  const infoTextColor = ["default", "bold", "retro"].includes(style) ? textOnPrimary : textColor;

  return (
    <div style={wrapperStyle}>
      <div style={getCardStyle()}>
        {/* Imagen placeholder */}
        <div style={{ height: 36, display: "flex", alignItems: "center", justifyContent: "center", ...imageBg }}>
          <span style={{ fontSize: 12, opacity: 0.4 }}>🍽️</span>
        </div>
        {/* Info */}
        <div style={getInfoStyle()}>
          <div style={{ height: 4, borderRadius: 2, background: infoTextColor, opacity: 0.7, marginBottom: 3, width: "70%" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ height: 3, borderRadius: 2, background: infoTextColor, opacity: 0.5, width: "40%" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: accent, flexShrink: 0 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

interface CardStyleSelectorProps {
  value: CardStyle;
  onChange: (style: CardStyle) => void;
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
}

export function CardStyleSelector({
  value,
  onChange,
  primaryColor,
  accentColor,
  backgroundColor,
}: CardStyleSelectorProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-bold block text-muted-foreground uppercase tracking-wider">
        Estilo de tarjeta
      </Label>
      <div className="grid grid-cols-3 gap-2">
        {CARD_STYLES.map((style) => {
          const isSelected = value === style.id;
          return (
            <button
              key={style.id}
              type="button"
              onClick={() => onChange(style.id)}
              className={cn(
                "group relative flex flex-col rounded-xl border transition-all text-left cursor-pointer select-none overflow-hidden",
                isSelected
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-muted-foreground/40"
              )}
              aria-pressed={isSelected}
              aria-label={style.name}
            >
              {/* Mini preview con colores reales */}
              <div className="h-[72px] w-full">
                <MiniCardPreview
                  style={style.id}
                  primary={primaryColor}
                  accent={accentColor}
                  bg={backgroundColor}
                />
              </div>
              {/* Label */}
              <div className={cn(
                "px-2 py-1.5 border-t",
                isSelected ? "border-primary/20 bg-primary/5" : "border-border bg-card"
              )}>
                <span className={cn(
                  "text-[10px] font-bold block leading-none",
                  isSelected ? "text-primary" : "text-foreground"
                )}>
                  {style.name}
                </span>
                <span className="text-[8px] text-muted-foreground leading-tight mt-0.5 block line-clamp-1">
                  {style.description}
                </span>
              </div>
              {isSelected && (
                <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
