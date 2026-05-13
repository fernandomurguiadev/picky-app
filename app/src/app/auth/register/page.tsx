"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/shared/toast";
import { useAuthStore } from "@/lib/stores/auth.store";
import type { UserRole } from "@/lib/stores/auth.store";

const registerSchema = z.object({
  businessName: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

function PasswordStrengthIndicator({ password }: { password: string }) {
  const checks = [
    { label: "8+ caracteres", ok: password.length >= 8 },
    { label: "Mayúsculas y minúsculas", ok: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: "Números", ok: /\d/.test(password) },
    { label: "Caracteres especiales", ok: /[^a-zA-Z0-9]/.test(password) },
  ];

  if (!password) return null;

  return (
    <ul className="mt-2 space-y-1">
      {checks.map((c) => (
        <li key={c.label} className="flex items-center gap-1.5 text-xs">
          {c.ok ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span className={c.ok ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}>
            {c.label}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        const code = data?.error?.code;
        if (code === "EMAIL_ALREADY_EXISTS" || res.status === 409) {
          setError("email", { message: "Este email ya está registrado" });
        } else {
          toast.error(data?.error?.message ?? "Error al registrarse");
        }
        return;
      }

      setAuth({
        accessToken: data.access_token,
        tenantId: data.tenantId,
        role: data.role as UserRole,
      });

      toast.success("¡Cuenta creada! Bienvenido a PickyApp.");
      router.replace("/admin/dashboard");
    } catch {
      toast.error("No se pudo conectar con el servidor");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-sm space-y-6 rounded-xl bg-card p-8 shadow-sm border border-border">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight">Crear cuenta</h1>
          <p className="text-sm text-muted-foreground">
            Registrá tu comercio en PickyApp
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="businessName">Nombre del comercio</Label>
            <Input
              id="businessName"
              type="text"
              autoComplete="organization"
              placeholder="Ej: Almacén Don Juan"
              aria-invalid={!!errors.businessName}
              {...register("businessName")}
            />
            {errors.businessName?.message && (
              <p className="text-xs text-destructive">{errors.businessName.message}</p>
            )}
          </div>

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
            <Label htmlFor="phone">
              Teléfono{" "}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+54 9 11 0000-0000"
              {...register("phone")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                className="pr-10"
                aria-invalid={!!errors.password}
                {...register("password", {
                  onChange: (e) => setPasswordValue(e.target.value),
                })}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
            <PasswordStrengthIndicator password={passwordValue} />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crear cuenta
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tenés cuenta?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
