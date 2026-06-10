"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { usePlatformAuthStore } from "@/lib/stores/platform-auth.store";

export default function PlatformLoginPage() {
  const router = useRouter();
  const setAuth = usePlatformAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await axios.post<
        | { email: string; message: string }
        | { mfaRequired: true }
      >("/api/platform/auth/login", { email, password }, { withCredentials: true });

      if ("mfaRequired" in res.data) {
        setMfaRequired(true);
      } else {
        setAuth(res.data.email);
        router.replace("/platform/tenants");
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Error al iniciar sesión";
      setError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleMfa(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // MFA pending token is sent as httpOnly cookie automatically
      const res = await axios.post<{ email: string }>(
        "/api/platform/auth/login/mfa",
        { totpCode },
        { withCredentials: true }
      );
      setAuth(res.data.email);
      router.replace("/platform/tenants");
    } catch (err: unknown) {
      setError("Código MFA incorrecto");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Picky Platform</h1>
          <p className="text-sm text-muted-foreground">Panel de SuperAdmin</p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm space-y-4">
          {!mfaRequired ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="admin@picky.ar"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="password">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors h-10"
              >
                {loading ? "Iniciando sesión…" : "Iniciar sesión"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleMfa} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Ingresá el código de tu app autenticadora (6 dígitos).
              </p>

              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="totp">
                  Código MFA
                </label>
                <input
                  id="totp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  pattern="\d{6}"
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value)}
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring tracking-widest text-center"
                  placeholder="000000"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || totpCode.length !== 6}
                className="w-full inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors h-10"
              >
                {loading ? "Verificando…" : "Verificar código"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
