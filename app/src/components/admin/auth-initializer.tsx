"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth.store";
import type { UserRole } from "@/lib/stores/auth.store";

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const setAuth = useAuthStore((s) => s.setAuth);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [isInitializing, setIsInitializing] = useState(!isAuthenticated);
  const initialized = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (initialized.current || isAuthenticated) {
      if (isAuthenticated) {
        setIsInitializing(false);
      }
      return;
    }
    initialized.current = true;

    fetch("/api/auth/refresh", { method: "POST", credentials: "include" })
      .then((res) => {
        if (!res.ok) {
          router.replace("/auth/login?reason=session_expired");
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (!data?.tenantId) {
          router.replace("/auth/login?reason=session_expired");
          return;
        }
        setAuth({
          tenantId: data.tenantId ?? "",
          role: (data.role ?? "ADMIN") as UserRole,
        });
        setIsInitializing(false);
      })
      .catch(() => {
        router.replace("/auth/login?reason=session_expired");
      });
  }, [isAuthenticated, setAuth, router]);

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100">
        <div className="relative flex items-center justify-center">
          {/* Glowing Glassmorphism Background Arc */}
          <div className="absolute w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 to-rose-600 opacity-20 blur-xl animate-pulse"></div>
          
          {/* Double Spinning Ring for visual quality */}
          <div className="w-16 h-16 border-4 border-slate-800 rounded-full"></div>
          <div className="absolute w-16 h-16 border-4 border-t-amber-500 border-r-rose-600 rounded-full animate-spin"></div>
        </div>

        <div className="mt-8 text-center px-4 animate-fade-in">
          <h2 className="text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-500 font-sans">
            Picky
          </h2>
          <p className="mt-2 text-sm text-slate-400 font-medium">
            Restaurando tu sesión de administrador de forma segura...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
