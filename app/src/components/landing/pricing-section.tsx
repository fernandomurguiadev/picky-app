import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Check } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  description?: string | null;
  maxProducts: number;
  maxCategories: number;
  maxStaffUsers: number;
  maxImages: number;
  priceMonthly: number; // centavos — 0=gratis, -1=contactar, >0=precio
}

const PLAN_META: Record<
  string,
  { color: "zinc" | "emerald" | "indigo" | "amber"; emoji: string; isPopular?: boolean }
> = {
  Free:     { color: "zinc",    emoji: "🌱" },
  Starter:  { color: "emerald", emoji: "⚡" },
  Pro:      { color: "indigo",  emoji: "🚀", isPopular: true },
  Business: { color: "amber",   emoji: "🏢" },
};

const COLOR_STYLES = {
  zinc: {
    card: "bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-lg",
    label: "text-zinc-400",
    price: "text-zinc-900",
    priceSub: "text-zinc-400",
    badge: "",
    check: "text-zinc-500",
    feature: "text-zinc-600",
    icon: "bg-zinc-100 text-zinc-500",
    button: "border-zinc-200 text-zinc-700 hover:bg-zinc-50",
    dark: false,
  },
  emerald: {
    card: "bg-white border-zinc-200 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-50",
    label: "text-emerald-600",
    price: "text-zinc-900",
    priceSub: "text-zinc-400",
    badge: "",
    check: "text-emerald-500",
    feature: "text-zinc-600",
    icon: "bg-emerald-100 text-emerald-600",
    button: "border-emerald-300 text-emerald-700 hover:bg-emerald-50",
    dark: false,
  },
  indigo: {
    card: "bg-primary border-primary text-primary-foreground shadow-xl shadow-primary/30 scale-[1.03]",
    label: "text-primary-foreground/60",
    price: "text-primary-foreground",
    priceSub: "text-primary-foreground/60",
    badge: "bg-white/20 border-white/30 text-primary-foreground",
    check: "text-primary-foreground/70",
    feature: "text-primary-foreground/80",
    icon: "bg-white/15 text-primary-foreground",
    button: "bg-white text-primary hover:bg-white/90 border-transparent font-bold",
    dark: true,
  },
  amber: {
    card: "bg-white border-zinc-200 hover:border-amber-200 hover:shadow-lg hover:shadow-amber-50",
    label: "text-amber-600",
    price: "text-zinc-900",
    priceSub: "text-zinc-400",
    badge: "",
    check: "text-amber-500",
    feature: "text-zinc-600",
    icon: "bg-amber-100 text-amber-600",
    button: "border-amber-300 text-amber-700 hover:bg-amber-50",
    dark: false,
  },
};

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("es-AR").format(Math.round(cents / 100));
}

function limitText(n: number, singular: string, plural: string): string {
  if (n === -1) return "Ilimitado";
  return `${n} ${n === 1 ? singular : plural}`;
}

async function fetchPlans(): Promise<Plan[]> {
  // Intenta BACKEND_URL (server-side) y luego NEXT_PUBLIC_API_URL como fallback
  const base =
    process.env["BACKEND_URL"] ??
    process.env["NEXT_PUBLIC_API_URL"] ??
    "http://localhost:1000";

  try {
    const res = await fetch(`${base}/api/v1/public/plans`, {
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`[PricingSection] fetchPlans: ${res.status} ${res.statusText} — ${base}`);
      return [];
    }
    const json = await res.json();
    const rows: Plan[] = (json.data ?? json) as Plan[];
    // La query raw de PG devuelve números como strings — normalizamos
    return rows.map((p) => ({
      ...p,
      priceMonthly: Number(p.priceMonthly),
      maxProducts: Number(p.maxProducts),
      maxCategories: Number(p.maxCategories),
      maxStaffUsers: Number(p.maxStaffUsers),
      maxImages: Number(p.maxImages),
    }));
  } catch (err) {
    console.error(`[PricingSection] fetchPlans error — URL: ${base}/api/v1/public/plans`, err);
    return [];
  }
}

export async function PricingSection() {
  const [t, plans] = await Promise.all([getTranslations("landing"), fetchPlans()]);

  if (plans.length === 0) {
    return (
      <p className="text-center text-zinc-400 text-sm py-8">
        Los planes se están configurando. Volvé en unos minutos.
      </p>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 items-end">
      {plans.map((plan) => {
        const meta = PLAN_META[plan.name] ?? { color: "zinc" as const, emoji: "📦" };
        const styles = COLOR_STYLES[meta.color];

        const features: string[] = [
          limitText(plan.maxProducts, "producto", "productos"),
          limitText(plan.maxCategories, "categoría", "categorías"),
          limitText(plan.maxStaffUsers, "usuario staff", "usuarios staff"),
          limitText(plan.maxImages, "imagen", "imágenes"),
          plan.priceMonthly === 0
            ? "Soporte por email"
            : plan.priceMonthly === -1
              ? "Soporte dedicado"
              : "Soporte prioritario",
        ];

        return (
          <div
            key={plan.id}
            className={`relative flex flex-col rounded-3xl border p-6 transition-all duration-300 hover:-translate-y-1 ${styles.card}`}
          >
            {/* Popular badge */}
            {meta.isPopular && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className={`rounded-full border px-3 py-0.5 text-xs font-bold backdrop-blur-sm ${styles.badge}`}>
                  {t("pricing.popular")}
                </span>
              </div>
            )}

            {/* Icon + label */}
            <div className="flex items-center gap-2.5 mb-5">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-base shrink-0 ${styles.icon}`}>
                {meta.emoji}
              </div>
              <p className={`text-xs font-bold uppercase tracking-widest ${styles.label}`}>
                {plan.name}
              </p>
            </div>

            {/* Price */}
            <div className="mb-4">
              {plan.priceMonthly === -1 ? (
                <p className={`text-3xl font-extrabold ${styles.price}`}>A medida</p>
              ) : plan.priceMonthly === 0 ? (
                <span className={`text-4xl font-extrabold ${styles.price}`}>Gratis</span>
              ) : (
                <div className="flex items-end gap-1">
                  <span className={`text-xs font-medium mb-1 ${styles.priceSub}`}>ARS</span>
                  <span className={`text-3xl font-extrabold ${styles.price}`}>${formatPrice(plan.priceMonthly)}</span>
                  <span className={`mb-0.5 text-sm ${styles.priceSub}`}>{t("pricing.monthly")}</span>
                </div>
              )}
            </div>

            {/* Description */}
            {plan.description && (
              <p className={`text-[13px] leading-relaxed mb-4 ${styles.dark ? "text-primary-foreground/70" : "text-zinc-500"}`}>
                {plan.description}
              </p>
            )}

            {/* Divider */}
            <div className={`h-px mb-5 ${styles.dark ? "bg-white/20" : "bg-zinc-100"}`} />

            {/* Features */}
            <ul className="mb-8 flex-1 space-y-2.5">
              {features.map((feat) => (
                <li key={feat} className="flex items-start gap-2 text-sm">
                  <Check className={`mt-0.5 h-4 w-4 shrink-0 ${styles.check}`} />
                  <span className={styles.feature}>{feat}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            {plan.priceMonthly === 0 ? (
              <Link href="/auth/register" prefetch={false}>
                <button className={`w-full rounded-xl py-2.5 text-sm font-semibold border transition-colors ${styles.button}`}>
                  {t("pricing.cta")}
                </button>
              </Link>
            ) : plan.priceMonthly === -1 ? (
              <button className={`w-full rounded-xl py-2.5 text-sm font-semibold border transition-colors ${styles.button}`}>
                Contactar
              </button>
            ) : (
              <button
                className={`w-full rounded-xl py-2.5 text-sm font-semibold border transition-colors disabled:opacity-50 ${styles.button}`}
                disabled
              >
                {t("pricing.ctaPaid")}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
