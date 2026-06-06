"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { HelpCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const hexRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

export const BG_PRESETS = [
  { name: "Modern Light", hex: "#FFFFFF", isDark: false },
  { name: "Minimal Cream", hex: "#FDFBF7", isDark: false },
  { name: "Soft Gray", hex: "#F8F9FA", isDark: false },
  { name: "Sage Green", hex: "#F2F5F1", isDark: false },
  { name: "Blush Pink", hex: "#FFF1F2", isDark: false },
  { name: "Mint Breeze", hex: "#F0FDF4", isDark: false },
  { name: "Warm Amber", hex: "#FFFBEB", isDark: false },
  { name: "Soft Indigo", hex: "#EEF2FF", isDark: false },
  { name: "Cool Slate", hex: "#F1F5F9", isDark: false },
  { name: "Dark Charcoal", hex: "#111827", isDark: true },
  { name: "Obsidian Night", hex: "#09090B", isDark: true },
  { name: "Deep Forest", hex: "#064E3B", isDark: true },
  { name: "Midnight Blue", hex: "#1E3A8A", isDark: true },
  { name: "Wine Dark", hex: "#4C0519", isDark: true },
  { name: "Dark Cocoa", hex: "#271C19", isDark: true },
  { name: "Slate", hex: "#0F172A", isDark: true },
  { name: "Midnight Purple", hex: "#2E1065", isDark: true },
  { name: "Deep Ocean", hex: "#083344", isDark: true },
];

export const PALETTE_PRESETS = [
  // Clásicas
  { name: "Obsidiana", primary: "#FFFFFF", accent: "#A1A1AA", bg: "#09090B" },
  { name: "Burdeos", primary: "#FCA5A5", accent: "#FECDD3", bg: "#4C0519" },
  { name: "Esmeralda", primary: "#6EE7B7", accent: "#D1FAE5", bg: "#064E3B" },
  { name: "Terracota", primary: "#C05C3E", accent: "#FB923C", bg: "#FDFBF7" },
  { name: "Prusia", primary: "#93C5FD", accent: "#DBEAFE", bg: "#1E3A8A" },
  { name: "Cacao Artisan", primary: "#FDE68A", accent: "#FEF3C7", bg: "#271C19" },
  { name: "Cyber Neon", primary: "#3B82F6", accent: "#06B6D4", bg: "#09090B" },
  { name: "Bosque Oscuro", primary: "#10B981", accent: "#34D399", bg: "#111827" },
  { name: "Rosa Noche", primary: "#F43F5E", accent: "#FB7185", bg: "#111827" },
  { name: "Onix Dorado", primary: "#F59E0B", accent: "#FBBF24", bg: "#09090B" },
  { name: "Amatista", primary: "#8B5CF6", accent: "#D8B4FE", bg: "#0F172A" },
  { name: "Galaxia", primary: "#A855F7", accent: "#D8B4FE", bg: "#2E1065" },
  { name: "Mar Profundo", primary: "#06B6D4", accent: "#67E8F9", bg: "#083344" },
  { name: "Rosa Pastel", primary: "#E11D48", accent: "#FDA4AF", bg: "#FFF1F2" },
  { name: "Menta Fresca", primary: "#059669", accent: "#34D399", bg: "#F0FDF4" },
  // Modernas 2025
  { name: "Índigo", primary: "#6366F1", accent: "#C7D2FE", bg: "#0F172A" },
  { name: "Cobre", primary: "#F97316", accent: "#FED7AA", bg: "#09090B" },
  { name: "Sakura", primary: "#EC4899", accent: "#FBCFE8", bg: "#FFF1F2" },
  { name: "Limón", primary: "#EAB308", accent: "#FEF08A", bg: "#111827" },
  { name: "Aurora", primary: "#22D3EE", accent: "#A78BFA", bg: "#09090B" },
  { name: "Jade", primary: "#047857", accent: "#6EE7B7", bg: "#F2F5F1" },
  { name: "Titanio", primary: "#94A3B8", accent: "#E2E8F0", bg: "#0F172A" },
  { name: "Ámbar", primary: "#D97706", accent: "#FCD34D", bg: "#FFFBEB" },
  { name: "Violeta", primary: "#9333EA", accent: "#E9D5FF", bg: "#2E1065" },
  { name: "Neón Rosa", primary: "#F472B6", accent: "#FBCFE8", bg: "#111827" },
  { name: "Índigo Claro", primary: "#4F46E5", accent: "#C7D2FE", bg: "#EEF2FF" },
  { name: "Slate Minimal", primary: "#334155", accent: "#94A3B8", bg: "#F1F5F9" },
  // Edición extendida
  { name: "Coral", primary: "#F43F5E", accent: "#FCA5A5", bg: "#FFF1F2" },
  { name: "Petróleo", primary: "#0D9488", accent: "#5EEAD4", bg: "#0F172A" },
  { name: "Vino", primary: "#BE185D", accent: "#F9A8D4", bg: "#4C0519" },
  { name: "Cielo", primary: "#0EA5E9", accent: "#BAE6FD", bg: "#F8F9FA" },
  { name: "Granate", primary: "#DC2626", accent: "#FCA5A5", bg: "#09090B" },
  { name: "Oliva", primary: "#65A30D", accent: "#D9F99D", bg: "#F2F5F1" },
  { name: "Champagne", primary: "#B45309", accent: "#FDE68A", bg: "#FDFBF7" },
  { name: "Medianoche", primary: "#818CF8", accent: "#C7D2FE", bg: "#111827" },
  { name: "Nieve", primary: "#0F172A", accent: "#475569", bg: "#F1F5F9" },
  { name: "Fuego", primary: "#EA580C", accent: "#FB923C", bg: "#09090B" },
  { name: "Hielo", primary: "#38BDF8", accent: "#E0F2FE", bg: "#0F172A" },
  { name: "Mostaza", primary: "#CA8A04", accent: "#FEF08A", bg: "#FFFBEB" },
  { name: "Tinta", primary: "#6366F1", accent: "#E0E7FF", bg: "#FFFFFF" },
  { name: "Cemento", primary: "#78716C", accent: "#D6D3D1", bg: "#F8F9FA" },
];

interface BrandColorSelectorProps {
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
  backgroundColor: string;
  setBackgroundColor: (color: string) => void;
}

export function BrandColorSelector({
  primaryColor,
  setPrimaryColor,
  accentColor,
  setAccentColor,
  backgroundColor,
  setBackgroundColor,
}: BrandColorSelectorProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const safePrimary = hexRegex.test(primaryColor) ? primaryColor : "#000000";
  const safeAccent = hexRegex.test(accentColor) ? accentColor : "#ffffff";
  const safeBg = hexRegex.test(backgroundColor) ? backgroundColor : "#ffffff";

  const activePalette = PALETTE_PRESETS.find(
    (p) =>
      p.primary.toLowerCase() === primaryColor.toLowerCase() &&
      p.accent.toLowerCase() === accentColor.toLowerCase() &&
      p.bg.toLowerCase() === backgroundColor.toLowerCase()
  );

  return (
    <div className="space-y-5">
      {/* 1. Paletas Curadas */}
      <div className="space-y-2">
        <Label className="text-xs font-bold block text-muted-foreground uppercase tracking-wider">
          Paletas Recomendadas
        </Label>
        <div className="flex flex-wrap items-center gap-2 pt-1 max-h-[120px] overflow-y-auto pr-1 scrollbar-thin select-none">
          {PALETTE_PRESETS.map((preset) => {
            const isSelected =
              primaryColor.toLowerCase() === preset.primary.toLowerCase() &&
              accentColor.toLowerCase() === preset.accent.toLowerCase() &&
              backgroundColor.toLowerCase() === preset.bg.toLowerCase();
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => {
                  setPrimaryColor(preset.primary);
                  setAccentColor(preset.accent);
                  setBackgroundColor(preset.bg);
                  setAdvancedOpen(false);
                }}
                className={cn(
                  "relative px-3 py-1.5 rounded-full transition-all border text-[10px] font-bold flex items-center gap-1.5 cursor-pointer shadow-xs hover:scale-105 active:scale-95 select-none",
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary text-primary"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                )}
                aria-label={preset.name}
              >
                <span
                  className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-black/5 shrink-0"
                  style={{ backgroundColor: preset.primary }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: preset.accent }}
                  />
                </span>
                {preset.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Preview activo de la paleta seleccionada */}
      <div className="flex items-stretch gap-2 rounded-xl border bg-muted/20 p-2.5">
        {/* Swatches */}
        {[
          { label: "Primario", color: primaryColor },
          { label: "Secundario", color: accentColor },
          { label: "Fondo", color: backgroundColor },
        ].map(({ label, color }) => (
          <div key={label} className="flex flex-1 flex-col gap-1.5">
            <div
              className="h-7 w-full rounded-lg border border-black/10 shadow-inner"
              style={{ backgroundColor: color }}
            />
            <span className="text-center text-[8px] font-bold uppercase tracking-wider text-muted-foreground/70 leading-none">
              {label}
            </span>
            <span className="text-center text-[7px] font-mono text-muted-foreground/50 leading-none">
              {color.toUpperCase()}
            </span>
          </div>
        ))}
        {/* Badge paleta activa */}
        <div className="flex items-center pl-1 border-l border-border/40 ml-0.5">
          <span
            className={cn(
              "px-2 py-1 rounded-lg text-[9px] font-bold leading-tight text-center max-w-[60px] whitespace-normal",
              activePalette
                ? "bg-primary/10 text-primary"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            )}
          >
            {activePalette ? activePalette.name : "Personalizado"}
          </span>
        </div>
      </div>

      {/* 3. Ajuste fino — colapsable */}
      <div className="rounded-xl border border-dashed border-border/60">
        <button
          type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          className="flex w-full items-center justify-between px-3.5 py-2.5 text-left select-none hover:bg-muted/30 transition-colors rounded-xl"
        >
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Ajuste fino
            </span>
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[8px] font-semibold text-muted-foreground/70 uppercase tracking-wide leading-none">
              opcional
            </span>
          </div>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-muted-foreground/60 transition-transform duration-200",
              advancedOpen && "rotate-180"
            )}
          />
        </button>

        {advancedOpen && (
          <div className="px-3.5 pb-4 pt-1 space-y-4 border-t border-dashed border-border/40">
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Modificá colores individuales para personalizar la paleta seleccionada. El resultado se marca como <strong>Personalizado</strong>.
            </p>

            {/* Grilla triple de color pickers */}
            <div className="grid grid-cols-3 gap-3">
              {/* Color Primario */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1">
                  <Label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/70">
                    Primario
                  </Label>
                  <div className="group relative hidden md:inline-flex">
                    <HelpCircle className="w-2.5 h-2.5 text-muted-foreground/50 hover:text-muted-foreground cursor-pointer transition-colors" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block w-40 p-2 bg-popover text-popover-foreground text-[8px] rounded-lg border border-border shadow-md leading-relaxed z-50 pointer-events-none select-none animate-in fade-in duration-200">
                      Color del encabezado de la tienda, categorías activas y tarjetas.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-popover" />
                    </div>
                  </div>
                </div>
                <div className="relative flex items-center gap-1 bg-accent/10 border border-border/50 px-2 py-1.5 rounded-xl shadow-inner">
                  <input
                    type="color"
                    value={safePrimary}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-5 w-5 cursor-pointer rounded-full border-0 bg-transparent p-0 overflow-hidden shrink-0"
                  />
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider opacity-80 truncate">
                    {primaryColor}
                  </span>
                </div>
              </div>

              {/* Color Secundario */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1">
                  <Label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/70">
                    Secundario
                  </Label>
                  <div className="group relative hidden md:inline-flex">
                    <HelpCircle className="w-2.5 h-2.5 text-muted-foreground/50 hover:text-muted-foreground cursor-pointer transition-colors" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block w-40 p-2 bg-popover text-popover-foreground text-[8px] rounded-lg border border-border shadow-md leading-relaxed z-50 pointer-events-none select-none animate-in fade-in duration-200">
                      Botones secundarios de agregar y el botón final del carrito.
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-popover" />
                    </div>
                  </div>
                </div>
                <div className="relative flex items-center gap-1 bg-accent/10 border border-border/50 px-2 py-1.5 rounded-xl shadow-inner">
                  <input
                    type="color"
                    value={safeAccent}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="h-5 w-5 cursor-pointer rounded-full border-0 bg-transparent p-0 overflow-hidden shrink-0"
                  />
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider opacity-80 truncate">
                    {accentColor}
                  </span>
                </div>
              </div>

              {/* Fondo */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1">
                  <Label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/70">
                    Fondo
                  </Label>
                  <div className="group relative hidden md:inline-flex">
                    <HelpCircle className="w-2.5 h-2.5 text-muted-foreground/50 hover:text-muted-foreground cursor-pointer transition-colors" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block w-40 p-2 bg-popover text-popover-foreground text-[8px] rounded-lg border border-border shadow-md leading-relaxed z-50 pointer-events-none select-none animate-in fade-in duration-200">
                      Atmósfera general del catálogo (ej. claro sofisticado o tema oscuro).
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-popover" />
                    </div>
                  </div>
                </div>
                <div className="relative flex items-center gap-1 bg-accent/10 border border-border/50 px-2 py-1.5 rounded-xl shadow-inner">
                  <input
                    type="color"
                    value={safeBg}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="h-5 w-5 cursor-pointer rounded-full border-0 bg-transparent p-0 overflow-hidden shrink-0"
                  />
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider opacity-80 truncate">
                    {backgroundColor}
                  </span>
                </div>
              </div>
            </div>

            {/* Selector de fondos curados */}
            <div className="space-y-2.5 pt-1">
              <div>
                <Label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/70 block">
                  Fondos curados
                </Label>
                <p className="text-[9px] text-muted-foreground mt-0.5 leading-normal">
                  Atmósferas premium para el catálogo.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin select-none">
                {BG_PRESETS.map((preset) => {
                  const isSelected =
                    backgroundColor.toLowerCase() === preset.hex.toLowerCase();
                  return (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => setBackgroundColor(preset.hex)}
                      className={cn(
                        "group relative flex flex-col p-2 rounded-xl border transition-all text-left h-[66px] cursor-pointer select-none",
                        isSelected
                          ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                          : "border-border hover:border-muted-foreground/40 hover:shadow-xs bg-card"
                      )}
                      aria-pressed={isSelected}
                    >
                      <div
                        className="w-full h-5 rounded-lg shadow-inner border transition-all duration-200"
                        style={{
                          backgroundColor: preset.hex,
                          borderColor: preset.isDark
                            ? "rgba(255,255,255,0.2)"
                            : "rgba(0,0,0,0.1)",
                        }}
                      />
                      <div className="mt-1.5 px-0.5 w-full">
                        <span className="text-[9px] font-bold block truncate leading-none tracking-tight">
                          {preset.name}
                        </span>
                        <span className="text-[7px] font-mono opacity-60 leading-none mt-1 block">
                          {preset.hex}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
