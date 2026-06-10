"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { useAuthStore } from "@/lib/stores/auth.store";

export function ExchangeFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const code = params.get("code");
  const called = useRef(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    if (!code || called.current) return;
    called.current = true;

    axios
      .post<{ tenantId: string; role: "ADMIN" | "STAFF" }>(
        "/api/auth/impersonate/exchange",
        { code },
        { withCredentials: true }
      )
      .then((res) => {
        setAuth({ tenantId: res.data.tenantId, role: res.data.role });
        router.replace("/admin/dashboard");
      })
      .catch(() => {
        router.replace("/auth/login?reason=impersonation_failed");
      });
  }, [code, router, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-2">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">
          Iniciando sesión de impersonación…
        </p>
      </div>
    </div>
  );
}
