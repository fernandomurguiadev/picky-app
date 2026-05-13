import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * Instancia Axios para llamadas desde el BFF (server-side) o desde API routes.
 * Adjunta el Bearer token desde las cookies httpOnly via el flujo BFF.
 *
 * Para llamadas del browser, usar `apiBff` que enruta por /api/backend/[...path].
 */
export const apiServer = axios.create({
  baseURL: `${BACKEND_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10_000,
});

/**
 * Instancia Axios para llamadas client-side.
 * Siempre apunta al BFF de Next.js (`/api/backend/...`).
 * El BFF inyecta el JWT desde la cookie httpOnly.
 */
export const apiBff = axios.create({
  baseURL: "/api/backend/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10_000,
  withCredentials: true,
});

// ── Interceptor de request: adjuntar token desde Zustand (solo client) ────
let _getAccessToken: (() => string | null) | null = null;

export function setAccessTokenGetter(fn: () => string | null) {
  _getAccessToken = fn;
}

apiBff.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (_getAccessToken) {
    const token = _getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ── Interceptor de respuesta: refresh automático en 401 ───────────────────
type FailedRequest = {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
};

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
}

apiBff.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiBff(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // El refresh llama al BFF que a su vez llama a POST /auth/refresh
      const { data } = await axios.post<{ access_token: string }>(
        "/api/auth/refresh",
        {},
        { withCredentials: true }
      );

      const newToken = data.access_token;

      // Actualizar el token en Zustand
      if (_getAccessToken !== null && typeof window !== "undefined") {
        const { useAuthStore } = await import("@/lib/stores/auth.store");
        useAuthStore.getState().setAccessToken(newToken);
      }

      apiBff.defaults.headers.common.Authorization = `Bearer ${newToken}`;
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      processQueue(null, newToken);

      return apiBff(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);

      // Session expirada: limpiar y redirigir
      if (typeof window !== "undefined") {
        const { useAuthStore } = await import("@/lib/stores/auth.store");
        useAuthStore.getState().clearAuth();
        window.location.href = "/auth/login?reason=session_expired";
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
