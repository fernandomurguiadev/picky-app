"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const hexRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

const schema = z.object({
  primaryColor: z.string().regex(hexRegex, "Color hex inválido (ej. #FF5500)"),
  accentColor: z.string().regex(hexRegex, "Color hex inválido"),
});

type FormValues = z.infer<typeof schema>;

function StorePreview({
  primaryColor,
  accentColor,
  storeName,
}: {
  primaryColor: string;
  accentColor: string;
  storeName: string;
}) {
  return (
    <div
      className="rounded-xl border border-border overflow-hidden shadow-sm"
      style={{ "--store-primary": primaryColor, "--store-accent": accentColor } as React.CSSProperties}
    >
      {/* Header preview */}
      <div
        className="px-4 py-3 flex items-center justify-between text-white"
        style={{ backgroundColor: primaryColor }}
      >
        <span className="font-bold text-sm">{storeName || "Tu tienda"}</span>
        <div className="flex gap-2">
          <div className="h-4 w-16 rounded bg-white/20" />
          <div className="h-4 w-4 rounded-full bg-white/30" />
        </div>
      </div>

      {/* Content preview */}
      <div className="p-4 bg-background space-y-3">
        <div className="flex gap-2 overflow-hidden">
          {["Cat 1", "Cat 2", "Cat 3"].map((cat) => (
            <div
              key={cat}
              className="shrink-0 text-xs px-3 py-1 rounded-full text-white"
              style={{ backgroundColor: primaryColor }}
            >
              {cat}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-lg border border-border p-2 space-y-1">
              <div className="h-16 rounded bg-muted" />
              <div className="h-2 w-3/4 rounded bg-muted" />
              <div className="h-2 w-1/2 rounded bg-muted" />
              <button
                type="button"
                className="w-full text-xs py-1 rounded text-white text-center"
                style={{ backgroundColor: primaryColor }}
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
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      primaryColor: value?.primaryColor ?? "#000000",
      accentColor: value?.accentColor ?? "#ffffff",
    },
  });

  const primaryColor = watch("primaryColor");
  const accentColor = watch("accentColor");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section className="rounded-xl border border-border p-6 space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="t-primary">Color primario</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                className="h-10 w-16 cursor-pointer rounded border border-border bg-transparent p-0.5"
                {...register("primaryColor")}
                aria-label="Seleccionar color primario"
              />
              <Input
                id="t-primary"
                {...register("primaryColor")}
                placeholder="#000000"
                className="w-32 font-mono text-sm"
                aria-invalid={!!errors.primaryColor}
              />
            </div>
            {errors.primaryColor && (
              <p className="text-sm text-destructive">{errors.primaryColor.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="t-accent">Color de acento</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                className="h-10 w-16 cursor-pointer rounded border border-border bg-transparent p-0.5"
                {...register("accentColor")}
                aria-label="Seleccionar color de acento"
              />
              <Input
                id="t-accent"
                {...register("accentColor")}
                placeholder="#ffffff"
                className="w-32 font-mono text-sm"
                aria-invalid={!!errors.accentColor}
              />
            </div>
            {errors.accentColor && (
              <p className="text-sm text-destructive">{errors.accentColor.message}</p>
            )}
          </div>
        </section>

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending || !isDirty}>
            {isPending ? "Guardando..." : "Guardar tema"}
          </Button>
        </div>
      </form>

      <div>
        <p className="text-sm text-muted-foreground mb-3">Vista previa en tiempo real</p>
        <StorePreview
          primaryColor={hexRegex.test(primaryColor) ? primaryColor : "#000000"}
          accentColor={hexRegex.test(accentColor) ? accentColor : "#ffffff"}
          storeName={storeName}
        />
      </div>
    </div>
  );
}
