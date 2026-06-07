"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { BrandColorSelector } from "@/components/admin/brand-color-selector";
import { CardStyleSelector } from "@/components/admin/card-style-selector";
import { StorePreview } from "../store-preview";
import type { CardStyle } from "@/lib/types/store";
import { MOBILE_COLS_TO_LAYOUT } from "@/lib/types/store";
import { LayoutGrid, LayoutList, Rows3 } from "lucide-react";

const hexRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

const schema = z.object({
  primaryColor: z.string().regex(hexRegex, "Color hex inválido (ej. #FF5500)"),
  accentColor: z.string().regex(hexRegex, "Color hex inválido (ej. #FFFFFF)"),
  backgroundColor: z.string().regex(hexRegex, "Color hex inválido"),
  cardStyle: z.enum(["default", "minimal", "bold", "glass", "soft", "retro"]),
  mobileGridCols: z.union([z.literal(0), z.literal(1), z.literal(2)]),
});

type FormValues = z.infer<typeof schema>;

interface ThemeEditorProps {
  value: {
    primaryColor: string;
    accentColor: string;
    backgroundColor?: string;
    cardStyle?: CardStyle;
    mobileGridCols?: 0 | 1 | 2;
  } | null;
  storeName: string;
  onSubmit: (values: FormValues) => Promise<void>;
  isPending?: boolean;
}

export function ThemeEditor({ value, storeName, onSubmit, isPending }: ThemeEditorProps) {
  const {
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      primaryColor: value?.primaryColor ?? "#000000",
      accentColor: value?.accentColor ?? "#ffffff",
      backgroundColor: value?.backgroundColor ?? "#ffffff",
      cardStyle: value?.cardStyle ?? "default",
      mobileGridCols: (value?.mobileGridCols ?? 2) as 0 | 1 | 2,
    },
  });

  useEffect(() => {
    if (value) {
      reset({
        primaryColor: value.primaryColor,
        accentColor: value.accentColor,
        backgroundColor: value.backgroundColor ?? "#ffffff",
        cardStyle: value.cardStyle ?? "default",
        mobileGridCols: value.mobileGridCols ?? 2,
      });
    }
  }, [value, reset]);

  const primaryColor = watch("primaryColor");
  const accentColor = watch("accentColor");
  const backgroundColor = watch("backgroundColor");
  const cardStyle = watch("cardStyle");
  const mobileGridCols = watch("mobileGridCols");

  const safePrimary = hexRegex.test(primaryColor) ? primaryColor : "#000000";
  const safeAccent = hexRegex.test(accentColor) ? accentColor : "#ffffff";
  const safeBg = hexRegex.test(backgroundColor) ? backgroundColor : "#ffffff";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section className="rounded-xl border border-border p-6 space-y-6 bg-card">
          <BrandColorSelector
            primaryColor={primaryColor}
            setPrimaryColor={(color) => setValue("primaryColor", color, { shouldDirty: true, shouldValidate: true })}
            accentColor={accentColor}
            setAccentColor={(color) => setValue("accentColor", color, { shouldDirty: true, shouldValidate: true })}
            backgroundColor={backgroundColor}
            setBackgroundColor={(color) => setValue("backgroundColor", color, { shouldDirty: true, shouldValidate: true })}
          />

          <hr className="border-border/30" />

          <CardStyleSelector
            value={cardStyle}
            onChange={(style) => setValue("cardStyle", style, { shouldDirty: true })}
            primaryColor={safePrimary}
            accentColor={safeAccent}
            backgroundColor={safeBg}
          />

          <hr className="border-border/30" />

          <div className="space-y-2">
            <p className="text-sm font-medium">Vista mobile (por defecto)</p>
            <p className="text-xs text-muted-foreground">El cliente puede cambiarlo desde la tienda.</p>
            <div className="flex gap-2">
              {([1, 2, 0] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setValue("mobileGridCols", n, { shouldDirty: true })}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-colors ${
                    mobileGridCols === n
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                      : "border-border text-muted-foreground hover:border-border/80 hover:bg-muted/50"
                  }`}
                >
                  {n === 1 ? <LayoutList className="h-4 w-4" /> : n === 2 ? <LayoutGrid className="h-4 w-4" /> : <Rows3 className="h-4 w-4" />}
                  {n === 1 ? "1 col" : n === 2 ? "2 col" : "Lista"}
                </button>
              ))}
            </div>
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
          cardStyle={cardStyle}
          mobileLayout={MOBILE_COLS_TO_LAYOUT[mobileGridCols]}
        />
      </div>
    </div>
  );
}
