"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingCart, Eye, Check, Plus, Minus, HelpCircle } from "lucide-react";

const hexRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

const schema = z.object({
  primaryColor: z.string().regex(hexRegex, "Color hex inválido (ej. #FF5500)"),
  accentColor: z.string().regex(hexRegex, "Color hex inválido (ej. #FFFFFF)"),
  backgroundColor: z.string().regex(hexRegex, "Color hex inválido"),
});

type FormValues = z.infer<typeof schema>;

const BG_PRESETS = [
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

import { getContrastColor, StorePreview } from "../store-preview";

interface ThemeEditorProps {
  value: { primaryColor: string; accentColor: string; backgroundColor?: string } | null;
  storeName: string;
  onSubmit: (values: FormValues) => Promise<void>;
  isPending?: boolean;
}

export function ThemeEditor({ value, storeName, onSubmit, isPending }: ThemeEditorProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      primaryColor: value?.primaryColor ?? "#000000",
      accentColor: value?.accentColor ?? "#ffffff",
      backgroundColor: value?.backgroundColor ?? "#ffffff",
    },
  });

  // Sincroniza el formulario si los datos del backend terminan de cargar después del mount inicial
  useEffect(() => {
    if (value) {
      reset({
        primaryColor: value.primaryColor,
        accentColor: value.accentColor,
        backgroundColor: value.backgroundColor ?? "#ffffff",
      });
    }
  }, [value, reset]);

  const primaryColor = watch("primaryColor");
  const accentColor = watch("accentColor");
  const backgroundColor = watch("backgroundColor");

  // Helpers seguros de validación para renderizar el input picker
  const safePrimary = hexRegex.test(primaryColor) ? primaryColor : "#000000";
  const safeAccent = hexRegex.test(accentColor) ? accentColor : "#ffffff";
  const safeBg = hexRegex.test(backgroundColor) ? backgroundColor : "#ffffff";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section className="rounded-xl border border-border p-6 space-y-5 bg-card">
          {/* Paletas de Colores Recomendadas */}
          <div className="space-y-2 pb-4 border-b border-border/60">
            <Label className="text-xs font-semibold block text-muted-foreground uppercase tracking-wider">Paletas Recomendadas</Label>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {[
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
              ].map((preset) => {
                const isSelected = 
                  primaryColor.toLowerCase() === preset.primary.toLowerCase() && 
                  accentColor.toLowerCase() === preset.accent.toLowerCase() && 
                  backgroundColor.toLowerCase() === preset.bg.toLowerCase();
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setValue("primaryColor", preset.primary, { shouldDirty: true, shouldValidate: true });
                      setValue("accentColor", preset.accent, { shouldDirty: true, shouldValidate: true });
                      setValue("backgroundColor", preset.bg, { shouldDirty: true, shouldValidate: true });
                    }}
                    className={`relative px-3 py-1.5 rounded-full transition-all border text-[10px] font-bold flex items-center gap-1.5 cursor-pointer shadow-xs hover:scale-105 active:scale-95 select-none ${
                      isSelected 
                        ? "border-primary bg-primary/5 ring-1 ring-primary text-primary"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    }`}
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

          {/* Color Primario */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="t-primary" className="text-sm font-medium">Color primario</Label>
              <div className="group relative hidden md:inline-flex">
                <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/60 hover:text-muted-foreground cursor-pointer transition-colors" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2.5 bg-popover text-popover-foreground text-[10px] rounded-lg border border-border shadow-md leading-relaxed z-50 pointer-events-none select-none animate-in fade-in duration-200">
                  Se aplica al fondo del encabezado de tu tienda, a las tarjetas de productos en el catálogo y a las categorías activas.
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-popover" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={safePrimary}
                onChange={(e) => setValue("primaryColor", e.target.value, { shouldDirty: true, shouldValidate: true })}
                className="h-10 w-16 cursor-pointer rounded-lg border border-input bg-transparent p-1"
                aria-label="Seleccionar color primario"
              />
              <Input
                id="t-primary"
                {...register("primaryColor")}
                placeholder="#000000"
                className="w-36 font-mono text-sm rounded-lg"
                aria-invalid={!!errors.primaryColor}
              />
            </div>
            {/* Helper inline para mobile */}
            <p className="md:hidden text-xs text-muted-foreground/80 leading-normal pt-1">
              Se aplica al fondo del encabezado, a las tarjetas de productos y categorías activas.
            </p>
            {errors.primaryColor && (
              <p className="text-xs text-destructive font-medium">{errors.primaryColor.message}</p>
            )}
          </div>

          {/* Color Secundario */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="t-accent" className="text-sm font-medium">Color secundario</Label>
              <div className="group relative hidden md:inline-flex">
                <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/60 hover:text-muted-foreground cursor-pointer transition-colors" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2.5 bg-popover text-popover-foreground text-[10px] rounded-lg border border-border shadow-md leading-relaxed z-50 pointer-events-none select-none animate-in fade-in duration-200">
                  Se aplica a los botones de acción rápida como agregar al carrito y al botón de confirmación del pedido.
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-popover" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={safeAccent}
                onChange={(e) => setValue("accentColor", e.target.value, { shouldDirty: true, shouldValidate: true })}
                className="h-10 w-16 cursor-pointer rounded-lg border border-input bg-transparent p-1"
                aria-label="Seleccionar color secundario"
              />
              <Input
                id="t-accent"
                {...register("accentColor")}
                placeholder="#ffffff"
                className="w-36 font-mono text-sm rounded-lg"
                aria-invalid={!!errors.accentColor}
              />
            </div>
            {/* Helper inline para mobile */}
            <p className="md:hidden text-xs text-muted-foreground/80 leading-normal pt-1">
              Se aplica a los botones de agregar al carrito y confirmación del pedido.
            </p>
            {errors.accentColor && (
              <p className="text-xs text-destructive font-medium">{errors.accentColor.message}</p>
            )}
          </div>

          <hr className="my-6 border-border/60" />

          {/* Selector de Fondo (Presets Curados) */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-1.5">
                <Label className="text-sm font-semibold block">Fondo de la tienda</Label>
                <div className="group relative hidden md:inline-flex">
                  <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/60 hover:text-muted-foreground cursor-pointer transition-colors" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2.5 bg-popover text-popover-foreground text-[10px] rounded-lg border border-border shadow-md leading-relaxed z-50 pointer-events-none select-none animate-in fade-in duration-200">
                    Define la atmósfera general del catálogo. Podés elegir esquemas claros elegantes o temas oscuros muy modernos.
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-popover" />
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">Elegí una de nuestras atmósferas premium curadas para el catálogo.</p>
              {/* Helper inline para mobile */}
              <p className="md:hidden text-xs text-muted-foreground/80 leading-normal pt-1">
                Define la atmósfera de tu catálogo (fondos claros minimalistas o temas oscuros).
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
              {BG_PRESETS.map((preset) => {
                const isSelected = safeBg.toLowerCase() === preset.hex.toLowerCase();
                return (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => setValue("backgroundColor", preset.hex, { shouldDirty: true, shouldValidate: true })}
                    className={`group relative flex flex-col p-2 rounded-xl border transition-all text-left h-[80px] select-none ${
                      isSelected 
                        ? "border-primary ring-2 ring-primary/20 bg-primary/5" 
                        : "border-border hover:border-muted-foreground/40 hover:shadow-sm bg-card"
                    }`}
                    aria-pressed={isSelected}
                  >
                    {/* Mini preview del color con sombra sutil */}
                    <div 
                      className="w-full h-6 rounded-lg shadow-inner border transition-all duration-200 group-hover:scale-[1.01]" 
                      style={{ 
                        backgroundColor: preset.hex,
                        borderColor: preset.isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"
                      }} 
                    />
                    <div className="mt-2 px-0.5 w-full">
                      <span className="text-[10px] font-bold block truncate leading-none tracking-tight">{preset.name}</span>
                      <span className="text-[8px] font-mono opacity-60 leading-none mt-1 block">{preset.hex}</span>
                    </div>
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
            <input type="hidden" {...register("backgroundColor")} />
            {errors.backgroundColor && (
              <p className="text-xs text-destructive font-medium">{errors.backgroundColor.message}</p>
            )}
          </div>
        </section>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={isPending || !isDirty}
            className="rounded-xl px-6 shadow-sm font-medium"
          >
            {isPending ? "Guardando..." : "Guardar tema"}
          </Button>
        </div>
      </form>

      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Vista previa en tiempo real</p>
        <StorePreview
          primaryColor={safePrimary}
          accentColor={safeAccent}
          backgroundColor={safeBg}
          storeName={storeName}
        />
      </div>
    </div>
  );
}
