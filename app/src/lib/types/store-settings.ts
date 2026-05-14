export interface Shift {
  open: string;  // "HH:mm"
  close: string; // "HH:mm"
}

export type DayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export interface DaySchedule {
  day: DayKey;
  isOpen: boolean;
  shifts: Shift[];
}

export interface StoreSettings {
  id: string;
  tenantId: string;
  description: string | null;
  logoUrl: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  schedule: DaySchedule[] | null;
  timezone: string;
  primaryColor: string;
  accentColor: string;
  deliveryEnabled: boolean;
  deliveryCost: number; // centavos
  deliveryMinOrder: number; // centavos
  takeawayEnabled: boolean;
  inStoreEnabled: boolean;
  cashEnabled: boolean;
  transferEnabled: boolean;
  transferAlias: string | null;
  cardEnabled: boolean;
  isManualOpen: boolean | null;
  createdAt: string;
  updatedAt: string;
  tenant?: Tenant;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
}
