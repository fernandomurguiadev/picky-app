"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useStoreSettings, useUpdateStoreSettings } from "@/lib/hooks/admin/use-store-settings";

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
  const t = useTranslations("onboarding");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: settings } = useStoreSettings();

  const isOnboardingCompleted = settings?.tenant?.isOnboardingCompleted === true;

  useEffect(() => {
    if (isOnboardingCompleted) router.replace("/admin/dashboard");
  }, [isOnboardingCompleted, router]);

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
      toast.error(t("toasts.nameRequired"));
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
      toast.error(t("toasts.businessError"));
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
      toast.success(t("toasts.brandSuccess"));
      nextStep();
    } catch {
      toast.error(t("toasts.brandError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3 — crea categoría
  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      toast.error(t("toasts.categoryRequired"));
      return;
    }
    setIsSubmitting(true);
    try {
      const category = await createCategoryMutation.mutateAsync({ name: catName, isActive: true });
      setCreatedCategoryId(category.id);
      toast.success(t("toasts.categorySuccess"));
      nextStep();
    } catch {
      toast.error(t("toasts.categoryError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 4 — crea producto / servicio
  const handleStep4Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim() || !prodPrice) {
      toast.error(t("toasts.productRequired"));
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
      toast.success(storeType === "services" ? t("toasts.serviceSuccess") : t("toasts.productSuccess"));
      nextStep();
    } catch {
      toast.error(t("toasts.productError"));
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
              toast.error(t("toasts.scheduleRequired", { day: dayLabels[day] }));
              setIsSubmitting(false);
              return;
            }
            if (config.open >= config.close) {
              toast.error(t("toasts.scheduleInvalid", { day: dayLabels[day] }));
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
          isOnboardingCompleted: true,
        });
        toast.success(t("toasts.scheduleSuccess"));
      } else {
        await updateSettingsMutation.mutateAsync({
          isOnboardingCompleted: true,
        });
      }

      toast.success(t("toasts.finishTitle"), t("toasts.finishDesc"));
      setTimeout(() => router.replace("/admin/dashboard"), 1500);
    } catch {
      toast.error(t("toasts.finishError"));
      router.replace("/admin/dashboard");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsConfig = [
    { id: 1, label: t("steps.business"), icon: <Store className="h-4 w-4" /> },
    { id: 2, label: t("steps.brand"), icon: <Sparkles className="h-4 w-4" /> },
    { id: 3, label: t("steps.category"), icon: <FolderHeart className="h-4 w-4" /> },
    { id: 4, label: storeType === "services" ? t("steps.service") : t("steps.product"), icon: <PackagePlus className="h-4 w-4" /> },
    { id: 5, label: t("steps.schedule"), icon: <CalendarClock className="h-4 w-4" /> },
  ];

  const isLoading = !settings;

  if (isLoading || isOnboardingCompleted) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center animate-in fade-in duration-300">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            {isOnboardingCompleted ? t("loading.accessing") : t("loading.loading")}
          </p>
          <p className="text-xs text-muted-foreground">
            {isOnboardingCompleted ? t("loading.completed") : t("loading.checking")}
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
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1 font-medium max-w-xs mx-auto">
          {t("subtitle")}
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
              <h3 className="font-bold text-lg tracking-tight">{t("step1.title")}</h3>
              <p className="text-xs text-muted-foreground">{t("step1.subtitle")}</p>
            </div>

            {/* Nombre del negocio */}
            <div className="space-y-2">
              <Label htmlFor="storeName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t("step1.nameLabel")}
              </Label>
              <Input
                id="storeName"
                required
                autoFocus
                placeholder={t("step1.namePlaceholder")}
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="rounded-xl bg-accent/30"
              />
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t("step1.descLabel")} <span className="font-normal normal-case tracking-normal">({tCommon("optional").toLowerCase()})</span>
              </Label>
              <textarea
                id="description"
                rows={3}
                placeholder={t("step1.descPlaceholder")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-input bg-accent/30 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 resize-none"
              />
            </div>

            {/* Tipo de negocio */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("step1.typeLabel")}</Label>
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
                    <p className="font-semibold text-sm">{t("step1.typeProducts")}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{t("step1.typeProductsDesc")}</p>
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
                    <p className="font-semibold text-sm">{t("step1.typeServices")}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{t("step1.typeServicesDesc")}</p>
                  </div>
                </button>
              </div>
            </div>

            <div className={cn("rounded-xl border p-3 text-xs leading-relaxed", "border-primary/20 bg-primary/5 text-foreground/70")}>
              {storeType === "retail"
                ? t("step1.infoRetail")
                : t("step1.infoServices")}
            </div>

            <Button type="submit" className="w-full rounded-xl font-bold shadow-md" disabled={isSubmitting}>
              {isSubmitting ? t("actions.saving") : t("actions.continue")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        )}

        {/* STEP 2: Identidad Visual */}
        {currentStep === 2 && (
          <form noValidate onSubmit={handleStep2Submit} className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-1">
              <h3 className="font-bold text-lg tracking-tight">{t("step2.title")}</h3>
              <p className="text-xs text-muted-foreground">{t("step2.subtitle")}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("step2.logoLabel")}</Label>
              <ImageUploader
                value={logoUrl}
                onChange={(url) => setLogoUrl(url)}
                onRemove={() => setLogoUrl("")}
              />
            </div>

            <div className="space-y-3 pt-1">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("step2.colorsLabel")}</Label>
              <div className="md:hidden p-3 rounded-xl bg-accent/30 border border-border/40 text-[10px] text-muted-foreground leading-relaxed space-y-1 select-none">
                <p>{t("step2.primaryTip")}</p>
                <p>{t("step2.secondaryTip")}</p>
                <p>{t("step2.bgTip")}</p>
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
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">{t("step2.previewLabel")}</Label>
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
                {t("actions.back")}
              </Button>
              <Button type="submit" className="flex-1 rounded-xl font-bold shadow-md" disabled={isSubmitting}>
                {isSubmitting ? t("actions.saving") : t("actions.saveContinue")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        )}

        {/* STEP 3: Primera Categoría */}
        {currentStep === 3 && (
          <form noValidate onSubmit={handleStep3Submit} className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-1">
              <h3 className="font-bold text-lg tracking-tight">{t("step3.title")}</h3>
              <p className="text-xs text-muted-foreground">
                {storeType === "services"
                  ? t("step3.subtitleServices")
                  : t("step3.subtitleRetail")}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="catName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("step3.nameLabel")}</Label>
              <Input
                id="catName"
                required
                autoFocus
                placeholder={storeType === "services" ? t("step3.namePlaceholderServices") : t("step3.namePlaceholderRetail")}
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                className="rounded-xl bg-accent/30"
              />
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="ghost" className="rounded-xl text-muted-foreground" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("actions.back")}
              </Button>
              <Button type="submit" className="flex-1 rounded-xl font-bold" disabled={isSubmitting}>
                {isSubmitting ? t("actions.creating") : t("actions.createContinue")}
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
                {storeType === "services" ? t("step4.titleServices") : t("step4.titleRetail")}
              </h3>
              <p className="text-xs text-muted-foreground">
                {storeType === "services" ? t("step4.subtitleServices") : t("step4.subtitleRetail")}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prodName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {storeType === "services" ? t("step4.nameLabelServices") : t("step4.nameLabelRetail")}
              </Label>
              <Input
                id="prodName"
                required
                autoFocus
                placeholder={storeType === "services" ? t("step4.namePlaceholderServices") : t("step4.namePlaceholderRetail")}
                value={prodName}
                onChange={(e) => setProdName(e.target.value)}
                className="rounded-xl bg-accent/30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prodPrice" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {storeType === "services" ? t("step4.priceLabelServices") : t("step4.priceLabelRetail")}
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
                <p className="text-[10px] text-muted-foreground">{t("step4.priceZeroTip")}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="prodDesc" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {storeType === "services" ? t("step4.descLabelServices") : t("step4.descLabelRetail")}
              </Label>
              <Input
                id="prodDesc"
                placeholder={storeType === "services" ? t("step4.descPlaceholderServices") : t("step4.descPlaceholderRetail")}
                value={prodDesc}
                onChange={(e) => setProdDesc(e.target.value)}
                className="rounded-xl bg-accent/30"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {storeType === "services" ? t("step4.photoLabelServices") : t("step4.photoLabelRetail")}
              </Label>
              <ImageUploader
                value={prodImageUrl}
                onChange={(url) => setProdImageUrl(url)}
                onRemove={() => setProdImageUrl("")}
              />
              <p className="text-[10px] text-muted-foreground font-medium leading-normal">
                {storeType === "services"
                  ? t("step4.photoTipServices")
                  : t("step4.photoTipRetail")}
              </p>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="ghost" className="rounded-xl text-muted-foreground" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("actions.back")}
              </Button>
              <Button type="submit" className="flex-1 rounded-xl font-bold" disabled={isSubmitting}>
                {isSubmitting ? t("actions.publishing") : t("actions.publishContinue")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        )}

        {/* STEP 5: Horarios */}
        {currentStep === 5 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-1">
              <h3 className="font-bold text-lg tracking-tight">{t("step5.title")}</h3>
              <p className="text-xs text-muted-foreground">{t("step5.subtitle")}</p>
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
                      <span className="text-[10px] text-muted-foreground/80 font-extrabold uppercase px-1.5 shrink-0 tracking-wider select-none">{t("step5.to")}</span>
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
                  {t("actions.back")}
                </Button>
                <Button
                  onClick={() => handleStep5Complete(false)}
                  className="flex-1 rounded-xl font-bold shadow-md"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t("actions.finishing") : t("actions.finish")}
                </Button>
              </div>
              <Button
                variant="ghost"
                onClick={() => handleStep5Complete(true)}
                className="w-full rounded-xl text-[11px] text-muted-foreground/60 hover:text-foreground font-medium h-8"
                disabled={isSubmitting}
              >
                {t("step5.skip")}
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
