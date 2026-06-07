// Tipos para la tienda pública (visible al cliente final sin autenticación)

export type CardStyle = 'default' | 'minimal' | 'bold' | 'glass' | 'soft' | 'retro';

/** 0=list, 1=grid-1col, 2=grid-2col (valor guardado en DB) */
export type MobileGridCols = 0 | 1 | 2;

export type GridLayout = 'grid-1' | 'grid-2' | 'list';

export const MOBILE_COLS_TO_LAYOUT: Record<MobileGridCols, GridLayout> = {
  0: 'list',
  1: 'grid-1',
  2: 'grid-2',
};

export interface StoreTheme {
  primaryColor: string;
  accentColor: string;
  backgroundColor?: string;
  cardStyle?: CardStyle;
  mobileGridCols?: MobileGridCols;
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
