"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "@/lib/stores/auth.store";
import { toast } from "@/components/shared/toast";

const BACKEND_WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:4000";

type WebSocketEvent = string;
type EventHandler = (data: unknown) => void;

interface UseWebSocketOptions {
  /** tenantId para unirse al room correcto */
  tenantId?: string;
  /** Handlers para eventos específicos */
  on?: Record<WebSocketEvent, EventHandler>;
  /** Si false, no conecta */
  enabled?: boolean;
}

export function useWebSocket({ tenantId, on, enabled = true }: UseWebSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const accessToken = useAuthStore((s) => s.accessToken);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  // Sincronizar handlers en una referencia mutable para evitar closures viejos (stale)
  const handlersRef = useRef(on);
  handlersRef.current = on;

  const connect = useCallback(() => {
    if (!enabled || !accessToken) return;

    const socket = io(BACKEND_WS_URL, {
      auth: { token: accessToken },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.debug("[WS] Conectado", socket.id);
      setIsConnected(true);
      if (tenantId) {
        socket.emit("join-tenant", { tenantId });
      }
    });

    socket.on("disconnect", (reason) => {
      console.debug("[WS] Desconectado:", reason);
      setIsConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error("[WS] Error de conexión:", err.message);
    });

    // Evento de sesión expirada
    socket.on("session-expired", () => {
      clearAuth();
      toast.warning("Sesión expirada", "Por favor iniciá sesión nuevamente");
      window.location.href = "/auth/login?reason=session_expired";
    });

    // Escuchar eventos genéricos redirigiendo al handler de la Ref reactiva
    // Esto blinda el hook contra re-registros inútiles y stale closures.
    const registerRedirect = (event: string) => {
      socket.on(event, (data: unknown) => {
        handlersRef.current?.[event]?.(data);
      });
    };

    // Registramos los eventos que nos pasaron inicialmente
    if (handlersRef.current) {
      Object.keys(handlersRef.current).forEach(registerRedirect);
    }

    return socket;
  }, [accessToken, clearAuth, enabled, tenantId]);

  useEffect(() => {
    const socket = connect();

    return () => {
      if (socket) {
        socket.disconnect();
        socketRef.current = null;
      }
    };
  }, [connect]);

  const emit = useCallback((event: string, data?: unknown) => {
    socketRef.current?.emit(event, data);
  }, []);

  return {
    emit,
    isConnected,
  };
}
