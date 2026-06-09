"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStoreSettings, useUpdateStoreSettings } from "@/lib/hooks/admin/use-store-settings";
import { useCategories } from "@/lib/hooks/admin/use-categories";
import { useProducts } from "@/lib/hooks/admin/use-products";
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
  Sparkles,
  Loader2,
  ShoppingCart,
  MessageCircle,
} from "lucide-react";

import { StorePreview } from "@/components/admin/store-preview";
import { BrandColorSelector } from "@/components/admin/brand-color-selector";

const TOTAL_STEPS = 5;

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categoriesQuery = useCategories();
  const productsQuery = useProducts();
  const { data: settings } = useStoreSettings();

  const hasData =
    categoriesQuery.isSuccess &&
    categoriesQuery.data.length > 0 &&
    productsQuery.isSuccess &&
    productsQuery.data.data.length > 0;

  useEffect(() => {
    if (hasData) router.replace("/admin/dashboard");
  }, [hasData, router]);

  const updateSettingsMutation = useUpdateStoreSettings();
  const createCategoryMutation = useCreateCategory();
  const createProductMutation = useCreateProduct();

  // Step 1: Negocio
  const [storeType, setStoreType] = useState<"retail" | "services">("retail");
  const [storeName, setStoreName] = useState("");
  const [description, setDescription] = useState("");

  // Pre-fill name and description from existing settings
  useEffect(() => {
    if (settings) {
      if (settings.tenant?.name) setStoreName(settings.tenant.name);
      if (settings.description) setDescription(settings.description);
    }
  }, [settings]);

  // Step 2: Identidad Visual
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#0f172a");
  const [accentColor, setAccentColor] = useState("#ffffff");
  const [backgroundColor, setBackgroundColor] = useState("#FDFBF7");

  // Step 3: Categoría
  const [catName, setCatName] = useState("");
  const [createdCategoryId, setCreatedCategoryId] = useState("");

  // Step 4: Producto / Servicio
  const [prodName, setProdName] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodImageUrl, setProdImageUrl] = useState("");

  // Step 5: Horarios
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

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  // Step 1 — guarda nombre, descripción y tipo de negocio
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      toast.error("Ingresá el nombre del negocio");
      return;
    }
    setIsSubmitting(true);
    try {
      await updateSettingsMutation.mutateAsync({
        storeName: storeName.trim(),
        description: description.trim() || null,
        storeType,
      } as Parameters<typeof updateSettingsMutation.mutateAsync>[0]);
      nextStep();
    } catch {
      toast.error("Error al guardar los datos del negocio.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2 — guarda identidad visual (logo + colores)
  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateSettingsMutation.mutateAsync({
        logoUrl: logoUrl || null,
        primaryColor,
        accentColor,
        backgroundColor,
      });
      toast.success("¡Identidad de marca configurada!");
      nextStep();
    } catch {
      toast.error("Ocurrió un error al actualizar el perfil.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3 — crea categoría
  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      toast.error("Ingresá el nombre de la categoría");
      return;
    }
    setIsSubmitting(true);
    try {
      const category = await createCategoryMutation.mutateAsync({ name: catName, isActive: true });
      setCreatedCategoryId(category.id);
      toast.success("Categoría creada");
      nextStep();
    } catch {
      toast.error("No pudimos crear la categoría.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 4 — crea producto / servicio
  const handleStep4Submit = async (e: React.FormEvent) => {
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
        price: tosCents(parseFloat(prodPrice)),
        imageUrl: prodImageUrl || null,
        isActive: true,
        isFeatured: true,
        optionGroups: [],
      });
      toast.success(storeType === "services" ? "¡Primer servicio publicado!" : "¡Primer producto publicado!");
      nextStep();
    } catch {
      toast.error("Fallo al publicar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 5 — guarda horarios y redirige
  const handleStep5Complete = async (skip = false) => {
    setIsSubmitting(true);
    try {
      if (!skip) {
        const daysList = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
        const dayLabels: Record<string, string> = {
          monday: "Lunes", tuesday: "Martes", wednesday: "Miércoles",
          thursday: "Jueves", friday: "Viernes", saturday: "Sábado", sunday: "Domingo",
        };

        for (const day of daysList) {
          const config = schedule[day];
          if (config.isOpen) {
            if (!config.open || !config.close) {
              toast.error(`Ingresá el horario de ${dayLabels[day]}`);
              setIsSubmitting(false);
              return;
            }
            if (config.open >= config.close) {
              toast.error(`${dayLabels[day]}: el cierre debe ser posterior a la apertura.`);
              setIsSubmitting(false);
              return;
            }
          }
        }

        const finalSchedule = daysList.map((day) => {
          const config = schedule[day];
          const isOpen = Boolean(config.isOpen);
          return { day, isOpen, shifts: isOpen ? [{ open: config.open, close: config.close }] : [] };
        });

        await updateSettingsMutation.mutateAsync({
          schedule: finalSchedule as unknown as Parameters<typeof updateSettingsMutation.mutateAsync>[0]["schedule"],
        });
        toast.success("Horarios guardados");
      }

      toast.success("¡Configuración completada!", "Redirigiendo al dashboard...");
      setTimeout(() => router.replace("/admin/dashboard"), 1500);
    } catch {
      toast.error("Error guardando horarios, pero ya podés ir al Dashboard.");
      router.replace("/admin/dashboard");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsConfig = [
    { id: 1, label: "Negocio", icon: <Store className="h-4 w-4" /> },
    { id: 2, label: "Tu Marca", icon: <Sparkles className="h-4 w-4" /> },
    { id: 3, label: "Categoría", icon: <FolderHeart className="h-4 w-4" /> },
    { id: 4, label: storeType === "services" ? "Servicio" : "Producto", icon: <PackagePlus className="h-4 w-4" /> },
    { id: 5, label: "Horarios", icon: <CalendarClock className="h-4 w-4" /> },
  ];

  const isLoading = categoriesQuery.isLoading || productsQuery.isLoading;

  if (isLoading || hasData) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center animate-in fade-in duration-300">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {hasData ? "Accediendo a tu panel..." : "Cargando configuración..."}
          </p>
          <p className="text-xs text-muted-foreground">
            {hasData ? "Ya configuraste tu catálogo. Redirigiendo..." : "Verificando el estado de tu comercio..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 w-full max-w-md md:max-w-[530px] px-4 mx-auto">

      {/* Header */}
      <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4 shadow-inner">
          <Sparkles className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          Configurá tu comercio
        </h1>
        <p className="text-sm text-muted-foreground mt-1 font-medium max-w-xs mx-auto">
          Te guiamos en 5 simples pasos para abrir las puertas de tu local online.
        </p>
      </div>

      {/* Stepper */}
      <div className="w-full mb-8 relative flex justify-between px-2 items-center">
        <div className="absolute top-5 left-6 right-6 h-0.5 bg-accent -z-10" />
        <div
          className="absolute top-5 left-6 h-0.5 bg-primary -z-10 transition-all duration-500"
          style={{ width: `${((currentStep - 1) / (TOTAL_STEPS - 1)) * 88}%` }}
        />
        {stepsConfig.map((s) => {
          const isActive = s.id === currentStep;
          const isCompleted = s.id < currentStep;
          return (
            <div key={s.id} className="flex flex-col items-center gap-2">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 font-bold bg-background",
                isActive && "border-primary text-primary ring-4 ring-primary/10 scale-105",
                isCompleted && "border-primary bg-primary text-primary-foreground",
                !isActive && !isCompleted && "border-accent text-muted-foreground"
              )}>
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

      {/* Card */}
      <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-xl ring-1 ring-black/5 relative overflow-hidden animate-in zoom-in-95 duration-300">

        {/* STEP 1: Negocio */}
        {currentStep === 1 && (
          <form noValidate onSubmit={handleStep1Submit} className="space-y-5 animate-in fade-in duration-300">
            <div className="space-y-1">
              <h3 className="font-bold text-lg tracking-tight">Tu negocio</h3>
              <p className="text-xs text-muted-foreground">Nombre, descripción y tipo de comercio.</p>
            </div>

            {/* Nombre del negocio */}
            <div className="space-y-2">
              <Label htmlFor="storeName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Nombre del negocio
              </Label>
              <Input
                id="storeName"
                required
                autoFocus
                placeholder="Ej: La Burguesía, Estudio Nómade..."
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="rounded-xl bg-accent/30"
              />
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Descripción <span className="font-normal normal-case tracking-normal">(opcional)</span>
              </Label>
              <textarea
                id="description"
                rows={3}
                placeholder="Describí tu negocio en pocas palabras..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-input bg-accent/30 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none"
              />
            </div>

            {/* Tipo de negocio */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tipo de negocio</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setStoreType("retail")}
                  className={cn(
                    "flex flex-col items-center gap-3 rounded-xl border-2 p-4 text-center transition-all",
                    storeType === "retail" ? "border-primary bg-primary/5" : "border-border hover:border-border/60 hover:bg-muted/30"
                  )}
                >
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", storeType === "retail" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                    <ShoppingCart className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Productos</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">Carrito y checkout</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setStoreType("services")}
                  className={cn(
                    "flex flex-col items-center gap-3 rounded-xl border-2 p-4 text-center transition-all",
                    storeType === "services" ? "border-primary bg-primary/5" : "border-border hover:border-border/60 hover:bg-muted/30"
                  )}
                >
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", storeType === "services" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Servicios</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">Consultas por WhatsApp</p>
                  </div>
                </button>
              </div>
            </div>

            <div className={cn("rounded-xl border p-3 text-xs leading-relaxed", "border-primary/20 bg-primary/5 text-foreground/70")}>
              {storeType === "retail"
                ? "Tus clientes van a poder agregar productos al carrito y completar un pedido con entrega o retiro."
                : "Tus clientes van a ver tus servicios y te van a contactar directamente por WhatsApp para consultarte o pedir turno."}
            </div>

            <Button type="submit" className="w-full rounded-xl font-bold shadow-md" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Continuar"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        )}

        {/* STEP 2: Identidad Visual */}
        {currentStep === 2 && (
          <form noValidate onSubmit={handleStep2Submit} className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-1">
              <h3 className="font-bold text-lg tracking-tight">Identidad Visual</h3>
              <p className="text-xs text-muted-foreground">Subí el logo y elegí los colores de tu marca.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Logo de la tienda</Label>
              <ImageUploader
                value={logoUrl}
                onChange={(url) => setLogoUrl(url)}
                onRemove={() => setLogoUrl("")}
              />
            </div>

            <div className="space-y-3 pt-1">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Colores de Marca</Label>
              <div className="md:hidden p-3 rounded-xl bg-accent/30 border border-border/40 text-[10px] text-muted-foreground leading-relaxed space-y-1 select-none">
                <p>💡 <strong>Primario:</strong> Encabezados y tarjetas.</p>
                <p>🛍️ <strong>Secundario:</strong> Botones de acción.</p>
                <p>🎨 <strong>Fondo:</strong> Atmósfera general del catálogo.</p>
              </div>
              <BrandColorSelector
                primaryColor={primaryColor}
                setPrimaryColor={setPrimaryColor}
                accentColor={accentColor}
                setAccentColor={setAccentColor}
                backgroundColor={backgroundColor}
                setBackgroundColor={setBackgroundColor}
              />
            </div>

            <div className="space-y-2.5 pt-1 border-t border-border/30">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Vista previa</Label>
              <StorePreview
                primaryColor={primaryColor}
                accentColor={accentColor}
                backgroundColor={backgroundColor}
                storeName={storeName || "Tu tienda"}
              />
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="ghost" className="rounded-xl text-muted-foreground" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Atrás
              </Button>
              <Button type="submit" className="flex-1 rounded-xl font-bold shadow-md" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar y Continuar"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        )}

        {/* STEP 3: Primera Categoría */}
        {currentStep === 3 && (
          <form noValidate onSubmit={handleStep3Submit} className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-1">
              <h3 className="font-bold text-lg tracking-tight">Tu primera Categoría</h3>
              <p className="text-xs text-muted-foreground">
                {storeType === "services"
                  ? "Agrupa tus servicios por tipo. Ej: Cortes, Coloraciones."
                  : "Agrupa tus productos. Ej: Hamburguesas, Bebidas."}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="catName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nombre de la categoría</Label>
              <Input
                id="catName"
                required
                autoFocus
                placeholder={storeType === "services" ? "Ej: Cortes de Cabello" : "Ej: Hamburguesas Clásicas"}
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
                {isSubmitting ? "Creando..." : "Crear y Continuar"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        )}

        {/* STEP 4: Primer Producto / Servicio */}
        {currentStep === 4 && (
          <form noValidate onSubmit={handleStep4Submit} className="space-y-5 animate-in fade-in duration-300">
            <div className="space-y-1">
              <h3 className="font-bold text-lg tracking-tight">
                {storeType === "services" ? "Tu primer Servicio" : "Tu primer Producto"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {storeType === "services" ? "El servicio estrella de tu negocio ⭐." : "Tu plato o producto estrella ⭐."}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prodName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {storeType === "services" ? "Nombre del Servicio" : "Nombre del Producto"}
              </Label>
              <Input
                id="prodName"
                required
                autoFocus
                placeholder={storeType === "services" ? "Ej: Corte y peinado" : "Ej: Burger Completa con papas"}
                value={prodName}
                onChange={(e) => setProdName(e.target.value)}
                className="rounded-xl bg-accent/30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prodPrice" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {storeType === "services" ? "Precio (0 si es a consultar)" : "Precio de Venta ($)"}
              </Label>
              <Input
                id="prodPrice"
                required
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={prodPrice}
                onChange={(e) => setProdPrice(e.target.value)}
                className="rounded-xl bg-accent/30"
              />
              {storeType === "services" && (
                <p className="text-[10px] text-muted-foreground">Precio 0 no se muestra en la tienda.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="prodDesc" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {storeType === "services" ? "Descripción (Opcional)" : "Ingredientes / Detalle (Opcional)"}
              </Label>
              <Input
                id="prodDesc"
                placeholder={storeType === "services" ? "Ej: Incluye lavado, corte y secado." : "Ej: Doble medallón, cheddar, lechuga y tomate."}
                value={prodDesc}
                onChange={(e) => setProdDesc(e.target.value)}
                className="rounded-xl bg-accent/30"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {storeType === "services" ? "Foto (Recomendado)" : "Foto del Producto (Recomendado)"}
              </Label>
              <ImageUploader
                value={prodImageUrl}
                onChange={(url) => setProdImageUrl(url)}
                onRemove={() => setProdImageUrl("")}
              />
              <p className="text-[10px] text-muted-foreground font-medium leading-normal">
                {storeType === "services"
                  ? "Una buena foto genera más consultas."
                  : "Los productos con foto venden hasta 3 veces más."}
              </p>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="ghost" className="rounded-xl text-muted-foreground" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Atrás
              </Button>
              <Button type="submit" className="flex-1 rounded-xl font-bold" disabled={isSubmitting}>
                {isSubmitting ? "Publicando..." : "Publicar y Continuar"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        )}

        {/* STEP 5: Horarios */}
        {currentStep === 5 && (
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
                        onCheckedChange={(checked) =>
                          setSchedule((prev) => ({ ...prev, [d.key]: { ...prev[d.key], isOpen: checked } }))
                        }
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
                        onChange={(e) =>
                          setSchedule((prev) => ({ ...prev, [d.key]: { ...prev[d.key], open: e.target.value } }))
                        }
                        className="h-9 sm:h-8 flex-1 sm:flex-none w-full sm:w-[125px] min-w-0 px-2 py-1 text-xs rounded-lg text-center shadow-inner font-medium [color-scheme:dark] border-border/60 focus:border-primary/50"
                        disabled={!item.isOpen}
                      />
                      <span className="text-[10px] text-muted-foreground/80 font-extrabold uppercase px-1.5 shrink-0 tracking-wider select-none">a</span>
                      <Input
                        type="time"
                        value={item.close}
                        onChange={(e) =>
                          setSchedule((prev) => ({ ...prev, [d.key]: { ...prev[d.key], close: e.target.value } }))
                        }
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
                  onClick={() => handleStep5Complete(false)}
                  className="flex-1 rounded-xl font-bold shadow-md"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Finalizando..." : "Finalizar 🚀"}
                </Button>
              </div>
              <Button
                variant="ghost"
                onClick={() => handleStep5Complete(true)}
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
