"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth.store";
import type { UserRole } from "@/lib/stores/auth.store";

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const setAuth = useAuthStore((s) => s.setAuth);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const initialized = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (initialized.current || isAuthenticated) return;
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
        if (!data?.access_token) return;
        const parts = data.access_token.split(".");
        const payload = parts[1]
          ? JSON.parse(atob(parts[1]))
          : {};
        setAuth({
          accessToken: data.access_token,
          tenantId: payload.tenantId ?? "",
          role: (payload.role ?? "ADMIN") as UserRole,
        });
      })
      .catch(() => {
        router.replace("/auth/login?reason=session_expired");
      });
  }, [isAuthenticated, setAuth, router]);

  return <>{children}</>;
}
