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
import { Switch } from "@/components/ui/switch";
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

function MiniStorePreview({ primaryColor, accentColor }: { primaryColor: string; accentColor: string }) {
  return (
    <div className="rounded-xl border border-border bg-background overflow-hidden shadow-md transition-all animate-in fade-in zoom-in-95 duration-300">
      <div className="px-3 py-1.5 bg-muted/30 border-b border-border/60 flex items-center gap-1.5 select-none">
        <div className="h-1.5 w-1.5 rounded-full bg-destructive/50" />
        <div className="h-1.5 w-1.5 rounded-full bg-warning/50" />
        <div className="h-1.5 w-1.5 rounded-full bg-success/50" />
        <span className="text-[9px] font-mono text-muted-foreground/80 ml-1 font-semibold tracking-tight">tu-tienda.picky.app</span>
      </div>
      
      <div className="p-3 space-y-3.5">
        {/* Cabecera Mockup */}
        <div 
          className="px-3 py-2.5 rounded-lg flex items-center justify-between transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-white/25 flex items-center justify-center">
              <Store className="h-2.5 w-2.5 text-white" />
            </div>
            <div className="h-2.5 w-14 rounded-sm bg-white/30" />
          </div>
          <div 
            className="h-5 w-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)] border border-white/10"
            style={{ backgroundColor: accentColor }}
          >
            <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: primaryColor }} />
          </div>
        </div>
        
        {/* Categorías Pill Mockup */}
        <div className="flex gap-1.5 overflow-hidden pt-0.5">
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className="h-4 px-2 rounded-full flex items-center shrink-0 border transition-all duration-300 text-[8px] font-bold shadow-sm"
              style={{ 
                backgroundColor: i === 1 ? primaryColor : "transparent",
                borderColor: i === 1 ? "transparent" : `${primaryColor}25`,
                color: i === 1 ? "#ffffff" : primaryColor
              }}
            >
              {i === 1 ? "Destacados" : `Cat ${i}`}
            </div>
          ))}
        </div>

        {/* Productos Grid Mockup */}
        <div className="grid grid-cols-2 gap-2.5">
          {[1, 2].map((i) => (
            <div key={i} className="border border-border/60 rounded-lg p-2 bg-card space-y-2 relative shadow-sm">
              <div className="h-12 rounded-md bg-muted/30 flex items-center justify-center border border-dashed border-border/30">
                <Sparkles className="h-3.5 w-3.5 opacity-15 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <div className="h-2 w-4/5 rounded-sm bg-muted/50" />
                <div className="h-1.5 w-3/5 rounded-sm bg-muted/30" />
              </div>
              <div 
                className="h-5 w-full rounded-md text-[8px] font-extrabold flex items-center justify-center text-white transition-all duration-300 shadow-[0_2px_4px_rgba(0,0,0,0.05)] hover:scale-95 active:scale-95"
                style={{ backgroundColor: primaryColor }}
              >
                Agregar
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
  const [primaryColor, setPrimaryColor] = useState("#0f172a"); // Slate/Negro premium por defecto
  const [accentColor, setAccentColor] = useState("#ffffff"); // Blanco por defecto

  // Step 2 State: Category
  const [catName, setCatName] = useState("");
  const [createdCategoryId, setCreatedCategoryId] = useState("");

  // Step 3 State: Product
  const [prodName, setProdName] = useState("");
  const [prodPrice, setProdPrice] = useState(""); // en Pesos UI
  const [prodDesc, setProdDesc] = useState("");
  const [prodImageUrl, setProdImageUrl] = useState("");

  // Step 4 State: Schedule detallado
  const [schedule, setSchedule] = useState<
    Record<string, { isOpen: boolean; open: string; close: string }>
  >({
    monday: { isOpen: true, open: "09:00", close: "18:00" },
    tuesday: { isOpen: true, open: "09:00", close: "18:00" },
    wednesday: { isOpen: true, open: "09:00", close: "18:00" },
    thursday: { isOpen: true, open: "09:00", close: "18:00" },
    friday: { isOpen: true, open: "09:00", close: "18:00" },
    saturday: { isOpen: false, open: "09:00", close: "18:00" },
    sunday: { isOpen: false, open: "09:00", close: "18:00" },
  });

  // Helpers
  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  // Submits per step
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    // El logo ahora es opcional para no bloquear la experiencia del usuario
    const finalLogoUrl = logoUrl || null;
    setIsSubmitting(true);
    try {
      await updateSettingsMutation.mutateAsync({
        logoUrl: finalLogoUrl,
        description: description || null,
        primaryColor: primaryColor,
        accentColor: accentColor,
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
        imageUrl: prodImageUrl || null,
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
        const daysList = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
        const dayLabels: Record<string, string> = {
          monday: "Lunes",
          tuesday: "Martes",
          wednesday: "Miércoles",
          thursday: "Jueves",
          friday: "Viernes",
          saturday: "Sábado",
          sunday: "Domingo"
        };

        // 1. Validación Defensiva de UX en Frontend
        for (const day of daysList) {
          const config = schedule[day];
          if (config.isOpen) {
            if (!config.open || !config.close) {
              toast.error(`Por favor, ingresá el horario de apertura y cierre para el ${dayLabels[day]}`);
              setIsSubmitting(false);
              return;
            }
            if (config.open >= config.close) {
              toast.error(`Error en ${dayLabels[day]}: La hora de cierre debe ser posterior al horario de apertura.`);
              setIsSubmitting(false);
              return;
            }
          }
        }

        // 2. Mapeo Estricto Sanitizado para Backend
        const finalSchedule = daysList.map((day) => {
          const config = schedule[day];
          const isOpen = Boolean(config.isOpen);
          return {
            day,
            isOpen,
            shifts: isOpen 
              ? [{ open: config.open, close: config.close }] 
              : [],
          };
        });
        
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
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 w-full max-w-md md:max-w-[530px] px-4 mx-auto">
      
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

            <div className="space-y-3 pt-1">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Colores de Marca</Label>
              
              {/* Swatches de colores predefinidos para el primario */}
              <div className="flex flex-wrap items-center gap-2.5">
                {[
                  { color: "#2563eb", name: "Azul" },
                  { color: "#ea580c", name: "Naranja" },
                  { color: "#dc2626", name: "Rojo" },
                  { color: "#16a34a", name: "Verde" },
                  { color: "#7c3aed", name: "Violeta" },
                  { color: "#0f172a", name: "Negro" },
                ].map((preset) => (
                  <button
                    key={preset.color}
                    type="button"
                    onClick={() => setPrimaryColor(preset.color)}
                    className={cn(
                      "h-7 w-7 rounded-full transition-all border border-white/10 ring-2 ring-transparent hover:scale-110 cursor-pointer flex items-center justify-center shadow-sm",
                      primaryColor === preset.color && "ring-primary ring-offset-2 ring-offset-background scale-110 shadow-md"
                    )}
                    style={{ backgroundColor: preset.color }}
                    aria-label={preset.name}
                  >
                    {primaryColor === preset.color && (
                      <div className="h-1.5 w-1.5 rounded-full bg-white animate-in zoom-in duration-200" />
                    )}
                  </button>
                ))}
              </div>

              {/* Grilla Dual de selectores manuales */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Color Primario</Label>
                  <div className="relative flex items-center gap-2 bg-accent/10 border border-border/50 px-2 py-1.5 rounded-xl shadow-inner">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-5 w-5 cursor-pointer rounded-full border-0 bg-transparent p-0 overflow-hidden shrink-0"
                    />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-80 truncate">{primaryColor}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Color Secundario</Label>
                  <div className="relative flex items-center gap-2 bg-accent/10 border border-border/50 px-2 py-1.5 rounded-xl shadow-inner">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="h-5 w-5 cursor-pointer rounded-full border-0 bg-transparent p-0 overflow-hidden shrink-0"
                    />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-80 truncate">{accentColor}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2.5 pt-1 border-t border-border/30">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Vista previa de tu local digital</Label>
              <MiniStorePreview primaryColor={primaryColor} accentColor={accentColor} />
            </div>

            <Button type="submit" className="w-full rounded-xl font-bold shadow-md hover:opacity-95 active:scale-[0.99] transition-all" disabled={isSubmitting}>
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

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Foto del Producto (Recomendado)</Label>
              <ImageUploader
                value={prodImageUrl}
                onChange={(url) => setProdImageUrl(url)}
                onRemove={() => setProdImageUrl("")}
              />
              <p className="text-[10px] text-muted-foreground font-medium leading-normal">Subí una foto atractiva. Los productos con fotos venden hasta 3 veces más.</p>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="ghost" className="rounded-xl text-muted-foreground" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Atrás
              </Button>
              <Button type="submit" className="flex-1 rounded-xl font-bold" disabled={isSubmitting}>
                {isSubmitting ? "Publicando..." : "Publicar y Avanzar"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        )}

        {/* STEP 4: Horarios */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-1">
              <h3 className="font-bold text-lg tracking-tight">Horarios de Atención</h3>
              <p className="text-xs text-muted-foreground">Configurá los días y horarios de apertura del local.</p>
            </div>

            <div className="space-y-2.5 max-h-[290px] overflow-y-auto overflow-x-hidden pr-2.5 select-none scrollbar-thin">
              {[
                { key: "monday", label: "Lunes" },
                { key: "tuesday", label: "Martes" },
                { key: "wednesday", label: "Miércoles" },
                { key: "thursday", label: "Jueves" },
                { key: "friday", label: "Viernes" },
                { key: "saturday", label: "Sábado" },
                { key: "sunday", label: "Domingo" },
              ].map((d) => {
                const item = schedule[d.key];
                return (
                  <div 
                    key={d.key} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-2.5 gap-3 sm:gap-2 rounded-xl border border-border/50 bg-accent/5 hover:bg-accent/10 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center gap-3 shrink-0">
                      <Switch 
                        id={`switch-${d.key}`}
                        checked={item.isOpen}
                        onCheckedChange={(checked) => {
                          setSchedule(prev => ({
                            ...prev,
                            [d.key]: { ...prev[d.key], isOpen: checked }
                          }));
                        }}
                      />
                      <Label 
                        htmlFor={`switch-${d.key}`} 
                        className={cn(
                          "text-sm font-medium cursor-pointer transition-colors min-w-[76px] inline-block", 
                          item.isOpen ? "text-foreground font-bold" : "text-muted-foreground font-medium"
                        )}
                      >
                        {d.label}
                      </Label>
                    </div>

                    <div className={cn(
                      "flex items-center gap-2 justify-between sm:justify-end w-full sm:w-auto transition-all duration-300",
                      !item.isOpen && "opacity-30 pointer-events-none"
                    )}>
                      <Input 
                        type="time" 
                        value={item.open}
                        onChange={(e) => {
                          setSchedule(prev => ({
                            ...prev,
                            [d.key]: { ...prev[d.key], open: e.target.value }
                          }));
                        }}
                        className="h-9 sm:h-8 flex-1 sm:flex-none w-full sm:w-[125px] min-w-0 px-2 py-1 text-xs rounded-lg text-center shadow-inner font-medium [color-scheme:dark] border-border/60 focus:border-primary/50"
                        disabled={!item.isOpen}
                      />
                      <span className="text-[10px] text-muted-foreground/80 font-extrabold uppercase px-1.5 shrink-0 tracking-wider select-none">a</span>
                      <Input 
                        type="time" 
                        value={item.close}
                        onChange={(e) => {
                          setSchedule(prev => ({
                            ...prev,
                            [d.key]: { ...prev[d.key], close: e.target.value }
                          }));
                        }}
                        className="h-9 sm:h-8 flex-1 sm:flex-none w-full sm:w-[125px] min-w-0 px-2 py-1 text-xs rounded-lg text-center shadow-inner font-medium [color-scheme:dark] border-border/60 focus:border-primary/50"
                        disabled={!item.isOpen}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t">
              <div className="flex gap-3">
                <Button type="button" variant="ghost" className="rounded-xl text-muted-foreground" onClick={prevStep} disabled={isSubmitting}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Atrás
                </Button>
                <Button 
                  onClick={() => handleStep4Complete(false)} 
                  className="flex-1 rounded-xl font-bold shadow-md"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Finalizando..." : "Finalizar 🚀"}
                </Button>
              </div>
              <Button 
                variant="ghost" 
                onClick={() => handleStep4Complete(true)} 
                className="w-full rounded-xl text-[11px] text-muted-foreground/60 hover:text-foreground font-medium h-8"
                disabled={isSubmitting}
              >
                Saltear horarios por ahora
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
