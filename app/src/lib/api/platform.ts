import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { usePlatformAuthStore } from "@/lib/stores/platform-auth.store";

export const apiBffPlatform = axios.create({
  baseURL: "/api/platform",
  headers: { "Content-Type": "application/json" },
  timeout: 10_000,
  withCredentials: true,
});

type FailedRequest = {
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
};

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

function processQueue(error: unknown) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(undefined)));
  failedQueue = [];
}

apiBffPlatform.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => apiBffPlatform(original))
        .catch((err) => Promise.reject(err));
    }

    original._retry = true;
    isRefreshing = true;

    try {
      await axios.post("/api/platform/auth/refresh", {}, { withCredentials: true });
      processQueue(null);
      return apiBffPlatform(original);
    } catch (refreshError) {
      processQueue(refreshError);
      if (typeof window !== "undefined") {
        usePlatformAuthStore.getState().clearAuth();
        window.location.href = "/platform/login";
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
