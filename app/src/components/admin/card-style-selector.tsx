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
  { id: "soft",     name: "Soft",      description: "Sombra de color de marca, efecto luminoso" },
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

  const primaryRgba = (alpha: number): string => {
    const hex = primary.replace("#", "");
    if (hex.length !== 6) return `rgba(0,0,0,${alpha})`;
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
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
        return { borderRadius: 0, border: "none", background: "transparent", overflow: "hidden" };
      case "bold": {
        const bpx = parseInt(primary.replace("#","").substring(0,2),16);
        const bpy = parseInt(primary.replace("#","").substring(2,4),16);
        const bpz = parseInt(primary.replace("#","").substring(4,6),16);
        const tint = isDark ? `rgba(${bpx},${bpy},${bpz},0.12)` : `rgb(${Math.round(255*0.91+bpx*0.09)},${Math.round(255*0.91+bpy*0.09)},${Math.round(255*0.91+bpz*0.09)})`;
        return { borderRadius: 20, border: "none", background: tint, boxShadow: isDark ? "0 12px 32px rgba(0,0,0,0.55)" : "0 12px 32px rgba(0,0,0,0.22)", overflow: "hidden" };
      }
      case "glass":
        return { borderRadius: 12, border: "2px solid transparent", background: `${isDark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.65)"} padding-box, linear-gradient(135deg, ${primary}, ${accent}) border-box`, backdropFilter: "blur(8px)", boxShadow: "0 2px 12px rgba(0,0,0,0.12)", overflow: "hidden" };
      case "soft": {
        const r = parseInt(primary.replace("#","").substring(0,2),16);
        const g = parseInt(primary.replace("#","").substring(2,4),16);
        const b = parseInt(primary.replace("#","").substring(4,6),16);
        const ra2 = parseInt(accent.replace("#","").substring(0,2),16);
        const ga2 = parseInt(accent.replace("#","").substring(2,4),16);
        const ba2 = parseInt(accent.replace("#","").substring(4,6),16);
        const bld = (c: number, t: number) => isDark ? Math.round(c*t) : Math.round(255*(1-t)+c*t);
        const g1 = `rgb(${bld(r,0.2)},${bld(g,0.2)},${bld(b,0.2)})`;
        const g2 = `rgb(${bld(ra2,0.14)},${bld(ga2,0.14)},${bld(ba2,0.14)})`;
        return { borderRadius: 10, border: "none", background: `linear-gradient(150deg, ${g1}, ${g2})`, boxShadow: `0 8px 24px rgba(${r},${g},${b},0.36)`, overflow: "hidden" };
      }
      case "retro":
        return { borderRadius: 0, border: "none", background: primary, overflow: "hidden" };
    }
  };

  const getInfoStyle = (): React.CSSProperties => {
    switch (style) {
      case "default":
        return { background: primary, padding: "4px 5px" };
      case "minimal":
        return { background: "transparent", padding: "4px 0", borderTop: "none" };
      case "bold":
        return { background: accent, padding: "5px 6px", borderRadius: "0 0 20px 20px" };
      case "glass":
        return { background: "transparent", padding: "4px 5px", borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"}` };
      case "soft": {
        const r = parseInt(primary.replace("#","").substring(0,2),16);
        const g = parseInt(primary.replace("#","").substring(2,4),16);
        const b = parseInt(primary.replace("#","").substring(4,6),16);
        return { background: `rgba(${r},${g},${b},0.2)`, padding: "4px 5px", borderTop: `2px solid rgba(${r},${g},${b},0.28)` };
      }
      case "retro":
        return { background: "transparent", padding: "4px 5px", borderTop: `1.5px solid ${textOnPrimary === "#fff" ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.15)"}` };
    }
  };

  const imageBg: React.CSSProperties = style === "retro"
    ? { background: textOnPrimary === "#fff" ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.15)" }
    : { background: mutedBg };

  const textOnAccentLocal = (() => {
    const hex = accent.replace("#", "");
    if (hex.length !== 6) return "#fff";
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 >= 128 ? "#000" : "#fff";
  })();

  const infoTextColor = ["default", "retro"].includes(style) ? textOnPrimary
    : style === "bold" ? textOnAccentLocal
    : textColor;

  return (
    <div style={wrapperStyle}>
      <div style={{ ...getCardStyle(), display: "flex", flexDirection: "column" }}>
        {/* Barra degradé superior solo para glass */}
        {style === "glass" && (
          <div style={{ height: 4, flexShrink: 0, background: `linear-gradient(90deg, ${primary}, ${accent})` }} />
        )}
        {/* Imagen placeholder */}
        <div style={{ height: style === "minimal" ? 42 : 36, display: "flex", alignItems: "center", justifyContent: "center", ...imageBg }}>
          <span style={{ fontSize: 12, opacity: style === "minimal" ? 0.6 : 0.4 }}>🍽️</span>
        </div>
        {/* Info */}
        <div style={getInfoStyle()}>
          <div style={{ height: 4, borderRadius: 2, background: infoTextColor, opacity: 0.7, marginBottom: 3, width: "70%" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ height: 3, borderRadius: 2, background: infoTextColor, opacity: 0.5, width: "40%" }} />
            {style !== "minimal" && (
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: accent, flexShrink: 0 }} />
            )}
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
