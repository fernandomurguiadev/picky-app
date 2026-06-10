"use client";

import { useRouter } from "next/navigation";
import axios from "axios";
import { useAuthStore } from "@/lib/stores/auth.store";

export function ImpersonationBanner() {
  const router = useRouter();
  const { clearAuth } = useAuthStore();
  const isImpersonated =
    typeof document !== "undefined" &&
    document.cookie.includes("impersonation-active=");

  if (!isImpersonated) return null;

  async function handleEnd() {
    try {
      await axios.post("/api/auth/impersonate/end", {}, { withCredentials: true });
    } finally {
      clearAuth();
      router.replace("/auth/login");
    }
  }

  return (
    <div className="fixed top-0 inset-x-0 z-50 bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-between text-sm font-medium shadow-md">
      <span>
        ⚠️ Sesión de impersonación activa — estás operando como este tenant
      </span>
      <button
        onClick={handleEnd}
        className="ml-4 shrink-0 rounded border border-amber-900/30 bg-amber-900/10 hover:bg-amber-900/20 px-3 py-1 text-xs font-semibold transition-colors"
      >
        Finalizar impersonación
      </button>
    </div>
  );
}
