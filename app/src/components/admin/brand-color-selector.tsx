"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const hexRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

export const BG_PRESETS = [
  { name: "Modern Light", hex: "#FFFFFF", isDark: false },
  { name: "Minimal Cream", hex: "#FDFBF7", isDark: false },
  { name: "Soft Gray", hex: "#F8F9FA", isDark: false },
  { name: "Sage Green", hex: "#F2F5F1", isDark: false },
  { name: "Dark Charcoal", hex: "#111827", isDark: true },
  { name: "Obsidian Night", hex: "#09090B", isDark: true },
  { name: "Deep Forest", hex: "#064E3B", isDark: true },
  { name: "Midnight Blue", hex: "#1E3A8A", isDark: true },
  { name: "Wine Dark", hex: "#4C0519", isDark: true },
  { name: "Dark Cocoa", hex: "#271C19", isDark: true },
  { name: "Slate", hex: "#0F172A", isDark: true },
  { name: "Midnight Purple", hex: "#2E1065", isDark: true },
  { name: "Deep Ocean", hex: "#083344", isDark: true },
  { name: "Blush Pink", hex: "#FFF1F2", isDark: false },
  { name: "Mint Breeze", hex: "#F0FDF4", isDark: false },
];

export const PALETTE_PRESETS = [
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
  
  // Safe hex helpers for input color pickers
  const safePrimary = hexRegex.test(primaryColor) ? primaryColor : "#000000";
  const safeAccent = hexRegex.test(accentColor) ? accentColor : "#ffffff";
  const safeBg = hexRegex.test(backgroundColor) ? backgroundColor : "#ffffff";

  return (
    <div className="space-y-6">
      {/* 1. Paletas Curadas */}
      <div className="space-y-2">
        <Label className="text-xs font-bold block text-muted-foreground uppercase tracking-wider">Paletas Recomendadas</Label>
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
                }}
                className={cn(
                  "relative px-3 py-1.5 rounded-full transition-all border text-[10px] font-bold flex items-center gap-1.5 cursor-pointer shadow-xs hover:scale-105 active:scale-95 select-none",
                  isSelected 
                    ? "border-primary bg-primary/5 ring-1 ring-primary text-primary"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                )}
                aria-label={preset.name}
              >
                {/* Mini indicador circular de la paleta */}
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-black/5 shrink-0" style={{ backgroundColor: preset.primary }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: preset.accent }} />
                </span>
                {preset.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Grilla Triple de selectores manuales */}
      <div className="grid grid-cols-3 gap-3 pt-1">
        {/* Color Primario */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1">
            <Label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/70">C. Primario</Label>
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
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider opacity-80 truncate">{primaryColor}</span>
          </div>
        </div>

        {/* Color Secundario */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1">
            <Label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/70">C. Secundario</Label>
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
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider opacity-80 truncate">{accentColor}</span>
          </div>
        </div>

        {/* Fondo Tienda */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1">
            <Label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/70">Fondo Tienda</Label>
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
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider opacity-80 truncate">{backgroundColor}</span>
          </div>
        </div>
      </div>

      <hr className="my-4 border-border/30" />

      {/* 3. Selector de Fondo (Presets Curados) */}
      <div className="space-y-3">
        <div>
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70 block">Fondo de la tienda</Label>
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-normal">Elegí una de nuestras atmósferas premium curadas para el catálogo.</p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 max-h-[170px] overflow-y-auto pr-1 scrollbar-thin select-none">
          {BG_PRESETS.map((preset) => {
            const isSelected = backgroundColor.toLowerCase() === preset.hex.toLowerCase();
            return (
              <button
                key={preset.hex}
                type="button"
                onClick={() => setBackgroundColor(preset.hex)}
                className={cn(
                  "group relative flex flex-col p-2 rounded-xl border transition-all text-left h-[70px] cursor-pointer select-none",
                  isSelected 
                    ? "border-primary ring-2 ring-primary/20 bg-primary/5" 
                    : "border-border hover:border-muted-foreground/40 hover:shadow-xs bg-card"
                )}
                aria-pressed={isSelected}
              >
                {/* Mini preview del color */}
                <div 
                  className="w-full h-5 rounded-lg shadow-inner border transition-all duration-200" 
                  style={{ 
                    backgroundColor: preset.hex,
                    borderColor: preset.isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"
                  }} 
                />
                <div className="mt-1.5 px-0.5 w-full">
                  <span className="text-[9px] font-bold block truncate leading-none tracking-tight">{preset.name}</span>
                  <span className="text-[7px] font-mono opacity-60 leading-none mt-1 block">{preset.hex}</span>
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
  );
}
