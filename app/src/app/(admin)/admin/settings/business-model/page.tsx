"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SkeletonLoader } from "@/components/shared/skeleton-loader";
import { useStoreSettings, useUpdateStoreSettings } from "@/lib/hooks/admin/use-store-settings";
import { toast } from "@/components/shared/toast";
import { ShoppingCart, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";

const schema = z.object({
  storeType: z.enum(["retail", "services"]),
  customCtaText: z.string().max(30).nullable(),
});

type FormValues = z.infer<typeof schema>;

export default function BusinessModelPage() {
  const t = useTranslations("settings.businessModel");
  const tCommon = useTranslations("common");
  const { data: settings, isLoading } = useStoreSettings();
  const updateMutation = useUpdateStoreSettings();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { storeType: "retail", customCtaText: null },
  });

  useEffect(() => {
    if (settings) {
      reset({
        storeType: settings.storeType ?? "retail",
        customCtaText: settings.customCtaText ?? null,
      });
    }
  }, [settings, reset]);

  const storeType = watch("storeType");

  const onSubmit = async (values: FormValues) => {
    try {
      await updateMutation.mutateAsync({
        storeType: values.storeType,
        customCtaText: values.storeType === "services" ? (values.customCtaText || null) : null,
      });
      toast.success(t("success"));
    } catch {
      toast.error(t("error"));
    }
  };

  if (isLoading) return <SkeletonLoader rows={4} columns={1} />;

  const canChangeStoreType = !settings?.tenant?.isOnboardingCompleted;

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <section className="rounded-xl border border-border p-6 space-y-5 bg-card">
        <div>
          <h2 className="font-semibold text-base">{t("title")}</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            disabled={!canChangeStoreType}
            onClick={() => setValue("storeType", "retail", { shouldDirty: true })}
            className={`flex flex-col gap-3 rounded-xl border-2 p-5 text-left transition-all ${
              storeType === "retail"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-border/80 hover:bg-muted/40"
            }`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${storeType === "retail" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"} ${!canChangeStoreType ? "opacity-50" : ""}`}>
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">{t("retailTitle")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("retailDesc")}
              </p>
            </div>
          </button>

          <button
            type="button"
            disabled={!canChangeStoreType}
            onClick={() => setValue("storeType", "services", { shouldDirty: true })}
            className={`flex flex-col gap-3 rounded-xl border-2 p-5 text-left transition-all ${
              storeType === "services"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-border/80 hover:bg-muted/40"
            }`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${storeType === "services" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"} ${!canChangeStoreType ? "opacity-50" : ""}`}>
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">{t("servicesTitle")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("servicesDesc")}
              </p>
            </div>
          </button>
        </div>

        {!canChangeStoreType && (
          <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800/40 mt-4">
            {t("cannotChange")}
          </p>
        )}

        <input type="hidden" {...register("storeType")} />
      </section>

      {storeType === "services" && (
        <section className="rounded-xl border border-border p-6 space-y-4 bg-card">
          <div>
            <h2 className="font-semibold text-base">{t("ctaTitle")}</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {t("ctaSubtitle")}
            </p>
          </div>
          <div className="space-y-1.5 max-w-xs">
            <Label htmlFor="cta-text">{t("ctaLabel")}</Label>
            <Input
              id="cta-text"
              {...register("customCtaText")}
              placeholder={t("ctaPlaceholder")}
              maxLength={30}
              className="rounded-lg"
            />
          </div>
        </section>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={updateMutation.isPending || !isDirty}
          className="rounded-xl px-6 shadow-sm font-medium"
        >
          {updateMutation.isPending ? tCommon("loading") : tCommon("save")}
        </Button>
      </div>
    </form>
  );
}
