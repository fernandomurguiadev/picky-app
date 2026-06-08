"use client";

import { createContext, useContext } from "react";

interface StoreConfig {
  storeType: "retail" | "services";
  customCtaText: string | null;
  whatsapp: string | null;
}

const StoreConfigContext = createContext<StoreConfig>({
  storeType: "retail",
  customCtaText: null,
  whatsapp: null,
});

export function StoreConfigProvider({
  children,
  storeType,
  customCtaText,
  whatsapp,
}: StoreConfig & { children: React.ReactNode }) {
  return (
    <StoreConfigContext.Provider value={{ storeType, customCtaText, whatsapp }}>
      {children}
    </StoreConfigContext.Provider>
  );
}

export function useStoreConfig() {
  return useContext(StoreConfigContext);
}
