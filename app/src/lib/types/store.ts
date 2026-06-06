// Tipos para la tienda pública (visible al cliente final sin autenticación)

export interface StoreTheme {
  primaryColor: string;
  accentColor: string;
  backgroundColor?: string;
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
  deliveryCost?: number; // centavos — puede ser null en la API
  deliveryMinOrder?: number; // centavos
  takeawayEnabled: boolean;
  inStoreEnabled: boolean;
  cashEnabled: boolean;
  transferEnabled: boolean;
  cardEnabled: boolean;
  transferAlias: string | null;
}

export interface Shift {
  open: string;
  close: string;
}

export interface DaySchedule {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  isOpen: boolean;
  shifts: Shift[];
}

export interface StoreStatus {
  isOpen: boolean;
  nextChange: string | null;
  source: 'manual' | 'schedule';
  todaySchedule?: DaySchedule | null;
}

export interface SelectedOption {
  groupId: string;
  groupName: string;
  itemId: string;
  itemName: string;
  priceModifier: number; // centavos
}
