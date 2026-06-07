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

const hexRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

const schema = z.object({
  primaryColor: z.string().regex(hexRegex, "Color hex inválido (ej. #FF5500)"),
  accentColor: z.string().regex(hexRegex, "Color hex inválido (ej. #FFFFFF)"),
  backgroundColor: z.string().regex(hexRegex, "Color hex inválido"),
  cardStyle: z.enum(["default", "minimal", "bold", "glass", "soft", "retro"]),
});

type FormValues = z.infer<typeof schema>;

interface ThemeEditorProps {
  value: {
    primaryColor: string;
    accentColor: string;
    backgroundColor?: string;
    cardStyle?: CardStyle;
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
    },
  });

  useEffect(() => {
    if (value) {
      reset({
        primaryColor: value.primaryColor,
        accentColor: value.accentColor,
        backgroundColor: value.backgroundColor ?? "#ffffff",
        cardStyle: value.cardStyle ?? "default",
      });
    }
  }, [value, reset]);

  const primaryColor = watch("primaryColor");
  const accentColor = watch("accentColor");
  const backgroundColor = watch("backgroundColor");
  const cardStyle = watch("cardStyle");

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
        />
      </div>
    </div>
  );
}
