export type OptionGroupType = "radio" | "checkbox";

export interface OptionItem {
  id: string;
  name: string;
  priceModifier: number; // centavos
  isDefault: boolean;
  order: number;
}

export interface OptionGroup {
  id: string;
  productId: string;
  name: string;
  type: OptionGroupType;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  order: number;
  items: OptionItem[];
}

export interface Category {
  id: string;
  tenantId: string;
  name: string;
  imageUrl: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  productCount?: number;
}

export interface Product {
  id: string;
  tenantId: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: number; // centavos
  imageUrl: string | null;
  isFeatured: boolean;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  category?: Pick<Category, "id" | "name">;
  optionGroups?: OptionGroup[];
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProductsQueryParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  search?: string;
  isActive?: boolean;
}

// ── Form types ──────────────────────────────────────────────────────────────

export interface OptionItemFormData {
  id?: string; // undefined si es nuevo
  name: string;
  priceModifier: number; // centavos
  isDefault: boolean;
  order: number;
}

export interface OptionGroupFormData {
  id?: string;
  name: string;
  type: OptionGroupType;
  isRequired: boolean;
  minSelections: number;
  maxSelections: number;
  order: number;
  items: OptionItemFormData[];
}

export interface ProductFormData {
  name: string;
  description: string;
  categoryId: string;
  price: number; // pesos (UI) — se convierte a centavos al enviar
  imageUrl: string | null;
  isFeatured: boolean;
  isActive: boolean;
  optionGroups: OptionGroupFormData[];
}
