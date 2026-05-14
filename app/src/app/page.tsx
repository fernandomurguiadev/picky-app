import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Smartphone, MessageSquareText, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const t = await getTranslations("landing");

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground antialiased selection:bg-primary/20">
      {/* Fondo Decorativo con Gradientes Modernos */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-[40%] -left-[10%] h-[80%] w-[60%] rounded-full bg-primary/10 blur-[120px] opacity-60 dark:opacity-30" />
        <div className="absolute top-[20%] -right-[20%] h-[70%] w-[60%] rounded-full bg-[#a855f7]/10 blur-[120px] opacity-50 dark:opacity-20" />
        <div className="absolute -bottom-[20%] left-[20%] h-[60%] w-[50%] rounded-full bg-primary/5 blur-[100px] opacity-40" />
      </div>

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-md transition-all">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 sm:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-primary to-[#8b5cf6] text-white shadow-lg shadow-primary/20">
              <span className="text-lg font-black tracking-wider">P</span>
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-foreground via-foreground to-foreground/70">
              PickyApp
            </span>
          </div>

          <nav className="flex items-center gap-4">
            <Link href="/auth/login" prefetch={false}>
              <Button variant="ghost" size="sm" className="hidden font-medium transition-colors hover:text-primary sm:flex">
                {t("hero.ctaSecondary")}
              </Button>
            </Link>
            <Link href="/auth/register" prefetch={false}>
              <Button size="sm" className="rounded-xl font-semibold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300 active:translate-y-0">
                {t("hero.ctaPrimary")}
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative flex-1">
        {/* Hero Section */}
        <section className="mx-auto max-w-4xl px-6 pt-20 pb-16 text-center sm:px-8 md:pt-32 md:pb-24">
          <div className="mx-auto mb-6 flex max-w-fit items-center justify-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary shadow-xs select-none animate-fade-in-up">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            {t("hero.badge")}
          </div>

          <h1 className="mb-6 text-4xl font-extrabold tracking-tight balance text-foreground sm:text-6xl md:text-7xl leading-[1.1]">
            {t("hero.title").split(" ").map((word, idx) => (
              <span key={idx} className={idx > 2 && idx < 5 ? "bg-clip-text text-transparent bg-linear-to-r from-primary via-[#8b5cf6] to-[#d946ef]" : ""}>
                {word}{" "}
              </span>
            ))}
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground/90 sm:text-xl">
            {t("hero.subtitle")}
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/auth/register" className="w-full sm:w-auto" prefetch={false}>
              <Button size="lg" className="group h-14 w-full rounded-2xl px-8 text-base font-bold shadow-xl shadow-primary/25 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/35 hover:-translate-y-1 active:translate-y-0 sm:w-auto">
                {t("hero.ctaPrimary")}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/auth/login" className="w-full sm:w-auto" prefetch={false}>
              <Button variant="outline" size="lg" className="h-14 w-full rounded-2xl border-border/60 bg-background/40 px-8 text-base font-bold backdrop-blur-xs hover:bg-muted/50 active:translate-y-0 hover:-translate-y-0.5 transition-all duration-300 sm:w-auto">
                {t("hero.ctaSecondary")}
              </Button>
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="mx-auto max-w-6xl px-6 py-16 sm:px-8 md:py-24 border-t border-border/20">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              {t("features.title")}
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              {t("features.subtitle")}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Feature 1 - Mobile */}
            <div className="group relative flex flex-col rounded-3xl border border-border/60 bg-card/50 p-8 shadow-xs transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/5 hover:bg-card/80 hover:border-primary/20 backdrop-blur-xs">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-white group-hover:scale-110">
                <Smartphone className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-bold group-hover:text-primary transition-colors">
                {t("features.mobile.title")}
              </h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                {t("features.mobile.desc")}
              </p>
            </div>

            {/* Feature 2 - WhatsApp */}
            <div className="group relative flex flex-col rounded-3xl border border-border/60 bg-card/50 p-8 shadow-xs transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/5 hover:bg-card/80 hover:border-primary/20 backdrop-blur-xs">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-all duration-300 group-hover:bg-emerald-500 group-hover:text-white group-hover:scale-110">
                <MessageSquareText className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-bold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {t("features.whatsapp.title")}
              </h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                {t("features.whatsapp.desc")}
              </p>
            </div>

            {/* Feature 3 - Real Time */}
            <div className="group relative flex flex-col rounded-3xl border border-border/60 bg-card/50 p-8 shadow-xs transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/5 hover:bg-card/80 hover:border-primary/20 backdrop-blur-xs">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 transition-all duration-300 group-hover:bg-purple-500 group-hover:text-white group-hover:scale-110">
                <LayoutDashboard className="h-6 w-6" />
              </div>
              <h3 className="mb-3 text-xl font-bold group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {t("features.realtime.title")}
              </h3>
              <p className="text-base leading-relaxed text-muted-foreground">
                {t("features.realtime.desc")}
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Section */}
      <footer className="w-full border-t border-border/20 bg-muted/30">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row sm:px-8">
          <p className="text-sm text-muted-foreground text-center sm:text-left">
            {t("footer.copy")}
          </p>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-sm text-muted-foreground transition-colors hover:text-primary">
              {t("footer.terms")}
            </Link>
            <Link href="#" className="text-sm text-muted-foreground transition-colors hover:text-primary">
              {t("footer.privacy")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
