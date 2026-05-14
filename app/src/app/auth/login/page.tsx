"use client";

import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Store, ChevronRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/shared/toast";
import { useAuthStore } from "@/lib/stores/auth.store";
import type { UserRole } from "@/lib/stores/auth.store";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") ?? "/admin/dashboard";
  const reason = searchParams.get("reason");

  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);

  // Multi-tenant selection flow state
  const [selectionData, setSelectionData] = useState<{
    selectionToken: string;
    tenants: { id: string; name: string; slug: string }[];
  } | null>(null);
  const [selectingTenantId, setSelectingTenantId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        const code = data?.error?.code;
        if (code === "INVALID_CREDENTIALS" || res.status === 401) {
          setError("email", { message: "Email o contraseña incorrectos" });
          setError("password", { message: "" });
        } else {
          toast.error(data?.error?.message ?? "Error al iniciar sesión");
        }
        return;
      }

      // Check if backend requires step 2 selection
      if (data.requiresSelection) {
        setSelectionData({
          selectionToken: data.selectionToken,
          tenants: data.tenants,
        });
        return;
      }

      setAuth({
        accessToken: data.access_token,
        tenantId: data.tenantId,
        role: data.role as UserRole,
      });

      router.replace(returnUrl);
    } catch {
      toast.error("No se pudo conectar con el servidor");
    }
  };

  const handleSelectTenant = async (tenantId: string) => {
    if (!selectionData) return;
    setSelectingTenantId(tenantId);
    try {
      const res = await fetch("/api/auth/select-tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectionToken: selectionData.selectionToken,
          tenantId,
        }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error?.message ?? "Error al seleccionar el comercio");
        return;
      }

      setAuth({
        accessToken: data.access_token,
        tenantId: data.tenantId,
        role: data.role as UserRole,
      });

      router.replace(returnUrl);
    } catch {
      toast.error("No se pudo conectar con el servidor");
    } finally {
      setSelectingTenantId(null);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-card p-8 shadow-sm border border-border transition-all animate-in fade-in duration-300">
        
        {!selectionData ? (
          // ==========================================
          // FASET 1: FORMULARIO DE CREDENCIALES
          // ==========================================
          <>
            <div className="space-y-1 text-center">
              <h1 className="text-2xl font-bold tracking-tight">Iniciar sesión</h1>
              <p className="text-sm text-muted-foreground">
                Ingresá a tu panel de administración
              </p>
            </div>

            {reason === "session_expired" && (
              <div className="rounded-md bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-400 animate-in slide-in-from-top-1">
                Tu sesión expiró. Volvé a iniciar sesión.
              </div>
            )}

            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="tu@email.com"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
                {errors.email?.message && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="pr-10"
                    aria-invalid={!!errors.password}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password?.message && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-end">
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Ingresar
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              ¿No tenés cuenta?{" "}
              <Link
                href="/auth/register"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Registrarte
              </Link>
            </p>
          </>
        ) : (
          // ==========================================
          // FASET 2: SELECCIONADOR PREMIUM DE COMERCIO
          // ==========================================
          <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
            <div className="space-y-2 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Store className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Elegí qué comercio administrar</h2>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Tu cuenta posee accesos activos en múltiples tiendas. Seleccioná una:
              </p>
            </div>

            <div className="grid gap-3">
              {selectionData.tenants.map((tenant) => {
                const isThisSelecting = selectingTenantId === tenant.id;
                const isAnySelecting = selectingTenantId !== null;

                return (
                  <button
                    key={tenant.id}
                    disabled={isAnySelecting}
                    onClick={() => handleSelectTenant(tenant.id)}
                    className={`
                      group flex items-center justify-between w-full p-4 text-left rounded-xl border 
                      bg-card shadow-sm transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-md
                      ${isThisSelecting 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50 hover:bg-accent/50"
                      }
                      disabled:opacity-50 disabled:pointer-events-none disabled:transform-none
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10 text-muted-foreground group-hover:text-primary transition-colors">
                        <Store className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm sm:text-base">
                          {tenant.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          slug: /{tenant.slug}
                        </p>
                      </div>
                    </div>

                    {isThisSelecting ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSelectionData(null)}
                disabled={selectingTenantId !== null}
                className="flex items-center justify-center w-full gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline py-2"
              >
                <ArrowLeft className="h-3 w-3" /> Volver al inicio de sesión
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="w-full max-w-md space-y-6 rounded-xl bg-card p-8 shadow-sm border border-border animate-pulse flex flex-col items-center">
          <div className="h-8 w-48 bg-accent/50 rounded mb-4" />
          <div className="h-10 w-full bg-accent/30 rounded" />
          <div className="h-10 w-full bg-accent/30 rounded mt-3" />
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
