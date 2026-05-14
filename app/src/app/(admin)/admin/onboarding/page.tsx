"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUpdateStoreSettings } from "@/lib/hooks/admin/use-store-settings";
import { useCreateCategory } from "@/lib/hooks/admin/use-categories";
import { useCreateProduct } from "@/lib/hooks/admin/use-products";
import { ImageUploader } from "@/components/shared/image-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/shared/toast";
import { cn, tosCents } from "@/lib/utils";
import { 
  Store, 
  FolderHeart, 
  PackagePlus, 
  CalendarClock, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2,
  Sparkles
} from "lucide-react";

const TOTAL_STEPS = 4;

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mutations
  const updateSettingsMutation = useUpdateStoreSettings();
  const createCategoryMutation = useCreateCategory();
  const createProductMutation = useCreateProduct();

  // Step 1 State: Profile
  const [logoUrl, setLogoUrl] = useState("");
  const [description, setDescription] = useState("");

  // Step 2 State: Category
  const [catName, setCatName] = useState("");
  const [createdCategoryId, setCreatedCategoryId] = useState("");

  // Step 3 State: Product
  const [prodName, setProdName] = useState("");
  const [prodPrice, setProdPrice] = useState(""); // en Pesos UI
  const [prodDesc, setProdDesc] = useState("");

  // Step 4 State: Schedule (simplificado)
  const [selectedDays, setSelectedDays] = useState<string[]>(["monday", "tuesday", "wednesday", "thursday", "friday"]);

  // Helpers
  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  // Submits per step
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logoUrl) {
      toast.error("Subí un logo para continuar", "Tu marca necesita una identidad visual.");
      return;
    }
    setIsSubmitting(true);
    try {
      await updateSettingsMutation.mutateAsync({
        logoUrl,
        description: description || null,
      });
      toast.success("¡Identidad de marca configurada!");
      nextStep();
    } catch {
      toast.error("Ocurrió un error al actualizar el perfil.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      toast.error("Ingresá el nombre de la categoría");
      return;
    }
    setIsSubmitting(true);
    try {
      const category = await createCategoryMutation.mutateAsync({
        name: catName,
        isActive: true,
      });
      setCreatedCategoryId(category.id);
      toast.success("Categoría inicial creada");
      nextStep();
    } catch {
      toast.error("No pudimos crear la categoría.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim() || !prodPrice) {
      toast.error("El nombre y el precio son obligatorios");
      return;
    }
    setIsSubmitting(true);
    try {
      await createProductMutation.mutateAsync({
        name: prodName,
        description: prodDesc || null,
        categoryId: createdCategoryId,
        price: tosCents(parseFloat(prodPrice)), // UI pesos -> backend centavos
        isActive: true,
        isFeatured: true,
        optionGroups: [],
      });
      toast.success("¡Primer producto publicado con éxito!");
      nextStep();
    } catch {
      toast.error("Fallo al dar de alta el producto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStep4Complete = async (skip = false) => {
    setIsSubmitting(true);
    try {
      if (!skip) {
        // Generar schedule básico de 9:00 a 18:00 para los días seleccionados
        const daysList = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
        const finalSchedule = daysList.map((day) => ({
          day,
          isOpen: selectedDays.includes(day),
          shifts: selectedDays.includes(day) ? [{ open: "09:00", close: "18:00" }] : [],
        }));
        
        await updateSettingsMutation.mutateAsync({
          schedule: finalSchedule as unknown as Parameters<typeof updateSettingsMutation.mutateAsync>[0]["schedule"],
        });
        toast.success("Horarios guardados");
      }
      
      toast.success("¡Configuración completada!", "Redirigiendo al dashboard...");
      setTimeout(() => {
        router.replace("/admin/dashboard");
      }, 1500);
    } catch {
      toast.error("Error guardando horarios, pero ya podés ir al Dashboard.");
      router.replace("/admin/dashboard");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsConfig = [
    { id: 1, label: "Tu Marca", icon: <Store className="h-4 w-4" /> },
    { id: 2, label: "Categoría", icon: <FolderHeart className="h-4 w-4" /> },
    { id: 3, label: "Producto", icon: <PackagePlus className="h-4 w-4" /> },
    { id: 4, label: "Horarios", icon: <CalendarClock className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 max-w-md mx-auto">
      
      {/* Header Onboarding */}
      <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4 shadow-inner">
          <Sparkles className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          Configurá tu comercio
        </h1>
        <p className="text-sm text-muted-foreground mt-1 font-medium max-w-xs mx-auto">
          Te guiamos en 4 simples pasos para que puedas abrir las puertas de tu local online.
        </p>
      </div>

      {/* Stepper Visual Progress */}
      <div className="w-full mb-8 relative flex justify-between px-2 items-center">
        {/* Background line */}
        <div className="absolute top-5 left-6 right-6 h-0.5 bg-accent -z-10" />
        {/* Completed progress line */}
        <div 
          className="absolute top-5 left-6 h-0.5 bg-primary -z-10 transition-all duration-500"
          style={{ width: `${((currentStep - 1) / (TOTAL_STEPS - 1)) * 88}%` }}
        />

        {stepsConfig.map((s) => {
          const isActive = s.id === currentStep;
          const isCompleted = s.id < currentStep;

          return (
            <div key={s.id} className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 font-bold bg-background",
                  isActive && "border-primary text-primary ring-4 ring-primary/10 scale-105",
                  isCompleted && "border-primary bg-primary text-primary-foreground",
                  !isActive && !isCompleted && "border-accent text-muted-foreground"
                )}
              >
                {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : s.icon}
              </div>
              <span className={cn(
                "text-[10px] font-bold tracking-wider uppercase transition-colors duration-300 hidden sm:inline-block",
                isActive ? "text-primary" : "text-muted-foreground/60"
              )}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Card Content Multi-Step */}
      <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-xl ring-1 ring-black/5 relative overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* STEP 1: Profile Info */}
        {currentStep === 1 && (
          <form noValidate onSubmit={handleStep1Submit} className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-1">
              <h3 className="font-bold text-lg tracking-tight">Identidad Visual</h3>
              <p className="text-xs text-muted-foreground">Subí el logo y contanos de qué se trata tu local.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Logo de la tienda</Label>
              <ImageUploader 
                value={logoUrl} 
                onChange={(url) => setLogoUrl(url)}
                onRemove={() => setLogoUrl("")} 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Descripción corta (Opcional)</Label>
              <Input
                id="desc"
                placeholder="Ej: Las mejores hamburguesas caseras de zona norte."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-xl bg-accent/30"
              />
            </div>

            <Button type="submit" className="w-full rounded-xl font-bold shadow-sm" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar y Continuar"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        )}

        {/* STEP 2: First Category */}
        {currentStep === 2 && (
          <form noValidate onSubmit={handleStep2Submit} className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-1">
              <h3 className="font-bold text-lg tracking-tight">Tu primer Categoría</h3>
              <p className="text-xs text-muted-foreground">Sirve para agrupar tus productos. Ej: Hamburguesas, Bebidas.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="catName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nombre de la categoría</Label>
              <Input
                id="catName"
                required
                autoFocus
                placeholder="Ej: Hamburguesas Clásicas"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                className="rounded-xl bg-accent/30"
              />
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="ghost" className="rounded-xl text-muted-foreground" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Atrás
              </Button>
              <Button type="submit" className="flex-1 rounded-xl font-bold" disabled={isSubmitting}>
                {isSubmitting ? "Creando..." : "Crear Categoría"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        )}

        {/* STEP 3: First Product */}
        {currentStep === 3 && (
          <form noValidate onSubmit={handleStep3Submit} className="space-y-5 animate-in fade-in duration-300">
            <div className="space-y-1">
              <h3 className="font-bold text-lg tracking-tight">Cargá tu primer Producto</h3>
              <p className="text-xs text-muted-foreground">Comencemos con tu plato o producto estrella ⭐.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prodName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nombre del Producto</Label>
              <Input
                id="prodName"
                required
                placeholder="Ej: Burger Completa con papas"
                value={prodName}
                onChange={(e) => setProdName(e.target.value)}
                className="rounded-xl bg-accent/30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prodPrice" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Precio de Venta ($)</Label>
              <Input
                id="prodPrice"
                required
                type="number"
                min="0"
                step="0.01"
                placeholder="9500"
                value={prodPrice}
                onChange={(e) => setProdPrice(e.target.value)}
                className="rounded-xl bg-accent/30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prodDesc" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Detalle de ingredientes (Opcional)</Label>
              <Input
                id="prodDesc"
                placeholder="Ej: Doble medallón, cheddar, lechuga y tomate."
                value={prodDesc}
                onChange={(e) => setProdDesc(e.target.value)}
                className="rounded-xl bg-accent/30"
              />
            </div>

            <Button type="submit" className="w-full rounded-xl font-bold" disabled={isSubmitting}>
              {isSubmitting ? "Publicando..." : "Publicar y Avanzar"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        )}

        {/* STEP 4: Horarios */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-1">
              <h3 className="font-bold text-lg tracking-tight">Días de Apertura</h3>
              <p className="text-xs text-muted-foreground">Seleccioná qué días de la semana querés que opere el local (Por defecto de 9:00 a 18:00hs).</p>
            </div>

            <div className="flex flex-wrap gap-2 py-2">
              {[
                { key: "monday", label: "Lun" },
                { key: "tuesday", label: "Mar" },
                { key: "wednesday", label: "Mié" },
                { key: "thursday", label: "Jue" },
                { key: "friday", label: "Vie" },
                { key: "saturday", label: "Sáb" },
                { key: "sunday", label: "Dom" },
              ].map((d) => {
                const isSelected = selectedDays.includes(d.key);
                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => {
                      setSelectedDays((prev) =>
                        prev.includes(d.key)
                          ? prev.filter((k) => k !== d.key)
                          : [...prev, d.key]
                      );
                    }}
                    className={cn(
                      "h-10 w-[52px] text-xs font-bold rounded-xl border flex items-center justify-center transition-all",
                      isSelected 
                        ? "bg-primary text-primary-foreground border-primary shadow-sm scale-105" 
                        : "border-border hover:bg-accent"
                    )}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 pt-2 border-t">
              <Button 
                onClick={() => handleStep4Complete(false)} 
                className="w-full rounded-xl font-bold shadow-md"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Finalizando..." : "Guardar y Finalizar 🚀"}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => handleStep4Complete(true)} 
                className="w-full rounded-xl text-muted-foreground/80 hover:text-foreground font-medium"
                disabled={isSubmitting}
              >
                Saltear por ahora
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
