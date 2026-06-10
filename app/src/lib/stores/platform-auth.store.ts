import { create } from "zustand";

interface PlatformAuthState {
  email: string | null;
  isAuthenticated: boolean;
  setAuth: (email: string) => void;
  clearAuth: () => void;
}

export const usePlatformAuthStore = create<PlatformAuthState>(() => ({
  email: null,
  isAuthenticated: false,
  setAuth: (email) =>
    usePlatformAuthStore.setState({ email, isAuthenticated: true }),
  clearAuth: () =>
    usePlatformAuthStore.setState({ email: null, isAuthenticated: false }),
}));
