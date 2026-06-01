"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingCart, Eye, Check, Plus, Minus, HelpCircle } from "lucide-react";
import { BrandColorSelector } from "@/components/admin/brand-color-selector";

const hexRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

const schema = z.object({
  primaryColor: z.string().regex(hexRegex, "Color hex inválido (ej. #FF5500)"),
  accentColor: z.string().regex(hexRegex, "Color hex inválido (ej. #FFFFFF)"),
  backgroundColor: z.string().regex(hexRegex, "Color hex inválido"),
});

type FormValues = z.infer<typeof schema>;

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
          <BrandColorSelector
            primaryColor={primaryColor}
            setPrimaryColor={(color) => setValue("primaryColor", color, { shouldDirty: true, shouldValidate: true })}
            accentColor={accentColor}
            setAccentColor={(color) => setValue("accentColor", color, { shouldDirty: true, shouldValidate: true })}
            backgroundColor={backgroundColor}
            setBackgroundColor={(color) => setValue("backgroundColor", color, { shouldDirty: true, shouldValidate: true })}
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
        />
      </div>
    </div>
  );
}
