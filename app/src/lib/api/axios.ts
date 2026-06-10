import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * Instancia Axios para llamadas desde el BFF (server-side) o desde API routes.
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
 * Apunta al BFF de Next.js (`/api/backend/...`).
 * El BFF inyecta el JWT desde la cookie httpOnly access-token.
 */
export const apiBff = axios.create({
  baseURL: "/api/backend/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10_000,
  withCredentials: true,
});

// ── Interceptor de respuesta: refresh automático en 401 ───────────────────
type FailedRequest = {
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
};

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

function processQueue(error: unknown) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(undefined);
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
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => apiBff(originalRequest))
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // El BFF rota el refresh-token y setea una nueva cookie access-token
      await axios.post("/api/auth/refresh", {}, { withCredentials: true });

      processQueue(null);
      return apiBff(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);

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
