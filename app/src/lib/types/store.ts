// Tipos para la tienda pública (visible al cliente final sin autenticación)

export interface StoreTheme {
  primaryColor: string;
  accentColor: string;
}

export interface StorePublicData {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  theme: StoreTheme;
  deliveryEnabled: boolean;
  takeawayEnabled: boolean;
  inStoreEnabled: boolean;
  cashEnabled: boolean;
  transferEnabled: boolean;
  cardEnabled: boolean;
  transferAlias: string | null;
}

export interface StoreStatus {
  isOpen: boolean;
}

export interface SelectedOption {
  groupId: string;
  groupName: string;
  itemId: string;
  itemName: string;
  priceModifier: number; // centavos
}
