"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { usePlatformAuthStore } from "@/lib/stores/platform-auth.store";

export function PlatformAuthInitializer({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const initialized = useRef(false);
  const [ready, setReady] = useState(false);
  const { isAuthenticated, setAuth } = usePlatformAuthStore();

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    axios
      .post<{ email: string }>(
        "/api/platform/auth/refresh",
        {},
        { withCredentials: true }
      )
      .then((res) => {
        setAuth(res.data.email);
        setReady(true);
      })
      .catch(() => {
        router.replace("/platform/login");
      });
  }, [router, setAuth]);

  if (!isAuthenticated || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
