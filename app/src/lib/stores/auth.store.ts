import { create } from "zustand";
import { setAccessTokenGetter } from "@/lib/api/axios";

export type UserRole = "ADMIN" | "STAFF";

interface AuthState {
  accessToken: string | null;
  tenantId: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;

  setAccessToken: (token: string) => void;
  setAuth: (params: {
    accessToken: string;
    tenantId: string;
    role: UserRole;
  }) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Registrar getter de token en Axios
  setAccessTokenGetter(() => useAuthStore.getState().accessToken);

  return {
    accessToken: null,
    tenantId: null,
    role: null,
    isAuthenticated: false,

    setAccessToken: (token) =>
      set({ accessToken: token, isAuthenticated: true }),

    setAuth: ({ accessToken, tenantId, role }) =>
      set({ accessToken, tenantId, role, isAuthenticated: true }),

    clearAuth: () =>
      set({
        accessToken: null,
        tenantId: null,
        role: null,
        isAuthenticated: false,
      }),
  };
});
