"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const hexRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

const schema = z.object({
  primaryColor: z.string().regex(hexRegex, "Color hex inválido (ej. #FF5500)"),
  accentColor: z.string().regex(hexRegex, "Color hex inválido (ej. #FFFFFF)"),
});

type FormValues = z.infer<typeof schema>;

// Helper rápido para calcular contraste (blanco o negro) basado en brillo hexadecimal
function getContrastColor(hexColor: string) {
  // Si no es hex válido, por defecto blanco
  if (!hexRegex.test(hexColor)) return "#ffffff";
  
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.substring(0, 2), 16);
  const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.substring(2, 4), 16);
  const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.substring(4, 6), 16);
  
  // Fórmula de luminiscencia estándar YIQ
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#ffffff";
}

function StorePreview({
  primaryColor,
  accentColor,
  storeName,
}: {
  primaryColor: string;
  accentColor: string;
  storeName: string;
}) {
  const textOnPrimary = getContrastColor(primaryColor);
  const textOnAccent = getContrastColor(accentColor);

  return (
    <div
      className="rounded-xl border border-border overflow-hidden shadow-sm bg-background"
      style={{ "--store-primary": primaryColor, "--store-accent": accentColor } as React.CSSProperties}
    >
      {/* Header preview */}
      <div
        className="px-4 py-3 flex items-center justify-between transition-colors duration-200"
        style={{ backgroundColor: primaryColor, color: textOnPrimary }}
      >
        <span className="font-bold text-sm">{storeName || "Tu tienda"}</span>
        <div className="flex gap-2">
          <div className="h-4 w-16 rounded bg-current/20" />
          <div className="h-4 w-4 rounded-full bg-current/30" />
        </div>
      </div>

      {/* Content preview */}
      <div className="p-4 space-y-3">
        <div className="flex gap-2 overflow-hidden">
          {["Cat 1", "Cat 2", "Cat 3"].map((cat) => (
            <div
              key={cat}
              className="shrink-0 text-xs px-3 py-1 rounded-full transition-colors duration-200"
              style={{ backgroundColor: primaryColor, color: textOnPrimary }}
            >
              {cat}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-lg border border-border p-2 space-y-2">
              <div className="h-16 rounded bg-muted" />
              <div className="space-y-1">
                <div className="h-2 w-3/4 rounded bg-muted" />
                <div className="h-2 w-1/2 rounded bg-muted" />
              </div>
              {/* Botón de acción principal usa el color SECUNDARIO (Acento) */}
              <button
                type="button"
                className="w-full text-xs py-1.5 rounded-lg font-medium transition-all duration-200 hover:opacity-90 active:scale-95"
                style={{ backgroundColor: accentColor, color: textOnAccent }}
              >
                Agregar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface ThemeEditorProps {
  value: { primaryColor: string; accentColor: string } | null;
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
    },
  });

  // Sincroniza el formulario si los datos del backend terminan de cargar después del mount inicial
  useEffect(() => {
    if (value) {
      reset({
        primaryColor: value.primaryColor,
        accentColor: value.accentColor,
      });
    }
  }, [value, reset]);

  const primaryColor = watch("primaryColor");
  const accentColor = watch("accentColor");

  // Helpers seguros de validación para renderizar el input picker
  const safePrimary = hexRegex.test(primaryColor) ? primaryColor : "#000000";
  const safeAccent = hexRegex.test(accentColor) ? accentColor : "#ffffff";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section className="rounded-xl border border-border p-6 space-y-5 bg-card">
          {/* Color Primario */}
          <div className="space-y-1.5">
            <Label htmlFor="t-primary" className="text-sm font-medium">Color primario</Label>
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
            {errors.primaryColor && (
              <p className="text-xs text-destructive font-medium">{errors.primaryColor.message}</p>
            )}
          </div>

          {/* Color Secundario */}
          <div className="space-y-1.5">
            <Label htmlFor="t-accent" className="text-sm font-medium">Color secundario</Label>
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
            {errors.accentColor && (
              <p className="text-xs text-destructive font-medium">{errors.accentColor.message}</p>
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
          storeName={storeName}
        />
      </div>
    </div>
  );
}
