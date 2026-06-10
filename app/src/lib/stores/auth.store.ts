import { create } from "zustand";

export type UserRole = "ADMIN" | "STAFF";

interface AuthState {
  tenantId: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;

  setAuth: (params: { tenantId: string; role: UserRole }) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>(() => ({
  tenantId: null,
  role: null,
  isAuthenticated: false,

  setAuth: ({ tenantId, role }) =>
    useAuthStore.setState({ tenantId, role, isAuthenticated: true }),

  clearAuth: () =>
    useAuthStore.setState({ tenantId: null, role: null, isAuthenticated: false }),
}));
